from contextlib import asynccontextmanager

import secrets
import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from announcement_service import find_latest_announcements
from command_router import Command, parse_command
from config import (
    APP_VERSION,
    SERVICE_NAME,
    get_debug_token,
    is_debug_endpoint_enabled,
)
from line_client import reply_text_message
from log_service import (
    LINE_QUERY_LOG_SHEET,
    append_line_query_log,
)
from permission_service import (
    can_view_internal_shrine,
    find_member_by_line_uid,
    normalize_text,
)
from reply_builder import (
    build_announcement_not_found_reply,
    build_announcements_reply,
    build_backfill_suggestions_reply,
    build_help_reply,
    build_internal_shrine_reply,
    build_not_found_logs_reply,
    build_not_found_reply,
    build_public_shrine_reply,
    build_recent_query_logs_reply,
    build_shrine_visits_reply,
    build_unknown_command_reply,
    build_visit_not_found_reply,
)
from query_log_lookup_service import (
    build_backfill_suggestions,
    find_recent_not_found_logs,
    find_recent_query_logs,
)
from sheets_client import read_sheet_records
from webhook_security import (
    IngressError,
    MAX_BODY_BYTES,
    hardened_off_settings,
    verify_signature,
    parse_verified_body,
)

from shrine_search_service import find_shrine
from shrine_visit_service import (
    find_recent_shrine_visits,
    find_recent_shrine_visits_by_keyword,
)


logger = logging.getLogger("line_ingress")


@asynccontextmanager
async def relay_lifespan(app):
    import os

    mode = os.getenv("LEGACY_RELAY_RUNTIME", "disabled")
    if mode == "disabled":
        yield
        return
    if mode == "controlled_line":
        import httpx
        from controlled_line_runtime import compose, controlled_settings
        import os
        async with httpx.AsyncClient(base_url=os.environ["RECEIPT_ADMISSION_URL"], follow_redirects=False, timeout=3) as client:
            app.state.production_relay = compose(client)
            app.state.webhook_settings_provider = controlled_settings
            yield
        return
    if mode != "off_journal":
        raise RuntimeError("unsupported_relay_mode")
    from relay_runtime import RelayRuntime, runtime_journal

    hardened_off_settings()
    try:
        journal = runtime_journal()
    except Exception:
        journal = None
        logger.error("relay_journal_unavailable")
    # V1 remains usable even if the journal disk becomes unavailable.
    app.state.production_relay = RelayRuntime(journal)

    yield


app = FastAPI(title="Zhongyuan Fude LINE Bot", version=APP_VERSION, lifespan=relay_lifespan)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": APP_VERSION,
    }


@app.get("/ready")
async def hardened_readiness():
    try:
        settings = getattr(app.state, "webhook_settings_provider", hardened_off_settings)()
        if not settings.channel_secret:
            raise IngressError(503, "signature_verifier_unconfigured")
    except IngressError as exc:
        return JSONResponse(status_code=503, content={"error": exc.code})
    runtime = getattr(app.state, "production_relay", None)
    if runtime is not None:
        try:
            if hasattr(runtime.journal, "metrics"):
                runtime.journal.metrics()
            else:
                runtime.journal.paused()
        except Exception:
            return JSONResponse(
                status_code=503, content={"error": "relay_journal_unavailable"}
            )
    return {
        "status": "ready",
        "mode": "controlled_line" if hasattr(runtime, "transport") else "hardened_off",
        "pilot_enabled": settings.pilot_enabled,
        "allowlist_empty": not bool(settings.pilot_allowlist),
        "v2_outbound_enabled": False,
        "signature_configured": True,
        "relay_journal_available": runtime is not None,
    }


@app.get("/debug/sheets")
async def debug_sheets(token: str | None = None):
    if not is_debug_endpoint_enabled():
        return JSONResponse(
            status_code=404,
            content={
                "status": "disabled",
                "message": "Debug endpoint is not enabled.",
            },
        )

    debug_token = get_debug_token()

    if debug_token and (not token or not secrets.compare_digest(token, debug_token)):
        return JSONResponse(
            status_code=403,
            content={
                "status": "forbidden",
                "message": "A valid debug token is required.",
            },
        )

    try:
        shrines = read_sheet_records("shrines")
        members = read_sheet_records("members")

        return {
            "status": "ok",
            "sheets": {
                "shrines": build_sheet_summary(shrines),
                "members": build_sheet_summary(members),
            },
        }
    except Exception:
        logger.error("debug_sheets_failed")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Unable to read sheet metadata.",
            },
        )


def build_sheet_summary(records: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "record_count": len(records),
        "headers": list(records[0].keys()) if records else [],
        "sample_names": [row.get("name", "") for row in records[:3]],
    }


def build_shrine_query_reply(
    query_text: str,
    line_user_id: str | None,
) -> tuple[str, dict[str, Any]]:
    shrines = read_sheet_records("shrines")
    members = read_sheet_records("members")
    member = find_member_by_line_uid(line_user_id, members)
    allow_internal = can_view_internal_shrine(member)

    print("member_found:", bool(member))
    print("allow_internal:", allow_internal)

    shrine = find_shrine(query_text, shrines, allow_internal=allow_internal)

    if not shrine:
        return build_not_found_reply(query_text), {
            "member": member,
            "shrine": None,
            "reply_type": "not_found",
            "result_status": "not_found",
            "error_message": "",
        }

    if allow_internal:
        return build_internal_shrine_reply(shrine, member), {
            "member": member,
            "shrine": shrine,
            "reply_type": "internal",
            "result_status": "success",
            "error_message": "",
        }

    return build_public_shrine_reply(shrine), {
        "member": member,
        "shrine": shrine,
        "reply_type": "public",
        "result_status": "success",
        "error_message": "",
    }


@app.post("/internal/relay/metrics")
async def relay_metrics(request: Request):
    import os
    import time
    from receipt_contract.contract import Authenticator, Credential, ContractError

    runtime = getattr(request.app.state, "production_relay", None)
    if runtime is None:
        return JSONResponse(status_code=503, content={"error": "relay_unconfigured"})
    raw = bytearray()
    async for chunk in request.stream():
        raw.extend(chunk)
        if len(raw) > 64:
            return JSONResponse(
                status_code=413, content={"error": "metrics_body_limit"}
            )
    try:
        kid = os.environ["RECEIPT_ADMISSION_KEY_ID"]
        key = os.environ["RECEIPT_ADMISSION_HMAC"].encode()
        auth = Authenticator(
            {kid: Credential(key, "metrics", "metrics", "synthetic")}, time.time
        )
        auth.verify(request.headers, bytes(raw), "/internal/relay/metrics")
        if bytes(raw) != b"{}":
            raise ContractError("metrics_request_invalid", 400)
        return runtime.journal.metrics()
    except ContractError as error:
        return JSONResponse(status_code=error.status, content={"error": error.code})
    except Exception:
        return JSONResponse(status_code=503, content={"error": "metrics_unavailable"})


@app.post("/webhook")
async def line_webhook(request: Request):
    try:
        provider = getattr(
            request.app.state, "webhook_settings_provider", hardened_off_settings
        )
        settings = provider()
        raw = bytearray()
        async for chunk in request.stream():
            if len(raw) + len(chunk) > MAX_BODY_BYTES:
                raise IngressError(413, "body_too_large")
            raw.extend(chunk)
        verify_signature(
            bytes(raw), request.headers.get("x-line-signature"), settings.channel_secret
        )
        events = parse_verified_body(bytes(raw), settings)
        from identity_capture import partition, runtime_capture
        import json

        capture = getattr(request.app.state, "identity_capture", None)
        if capture is None:
            capture = runtime_capture()
        events, capture_failed = await partition(
            events, json.loads(bytes(raw)).get("destination"), settings, capture
        )
        receipt_router = getattr(request.app.state, "receipt_contract_router", None)
        runtime = getattr(request.app.state, "production_relay", None)
        if runtime is not None:
            await runtime.dispatch_real(events, settings, dispatch_legacy_event)
        elif receipt_router is not None:
            await receipt_router.process(events, settings, dispatch_legacy_event)
        elif settings.pilot_enabled and settings.pilot_allowlist:
            # No production queue binding is provided by this local Gate.
            # Explicit injection is exclusively for synthetic local readiness tests.
            router = getattr(request.app.state, "local_pilot_router", None)
            if router is None:
                raise IngressError(503, "durable_relay_not_configured")
            await router.process(events, settings, dispatch_legacy_event)
        else:
            # OFF / empty allowlist: no relay/storage/worker dependency.
            for event in events:
                await dispatch_legacy_event(event)
        if capture_failed:
            logger.error("identity_capture_pending_operator_review")
        return JSONResponse(status_code=200, content={"status": "ok"})
    except IngressError as exc:
        logger.warning("webhook_rejected code=%s", exc.code)
        return JSONResponse(status_code=exc.status, content={"error": exc.code})
    except Exception:
        # Never stringify provider/transport exceptions (may contain body/token).
        logger.error("webhook_processing_failed")
        return JSONResponse(
            status_code=503, content={"error": "processing_unavailable"}
        )


async def dispatch_legacy_event(event: dict[str, Any], effects=None) -> None:
    if event.get("type") == "message" and event.get("replyToken"):
        message = event.get("message", {})
        await handle_text_message(
            reply_token=event["replyToken"],
            user_id=event.get("source", {}).get("userId"),
            message_text=message.get("text"),
            message_type=message.get("type"),
            effects=effects,
        )


async def handle_text_message(
    *,
    reply_token: str,
    user_id: str | None,
    message_text: str | None,
    message_type: str = "text",
    effects=None,
) -> None:
    command = parse_command(message_text, message_type)
    log_meta = {
        "member": None,
        "shrine": None,
        "reply_type": "error",
        "result_status": "error",
        "query_type": command.command_type,
        "target_sheet": "",
        "error_message": "",
    }

    try:
        reply_text, log_meta = build_command_reply(command, user_id)
    except Exception:
        error_message = "legacy_lookup_failed"
        logger.error("legacy_lookup_failed")
        reply_text = "系統暫時無法查詢友宮資料，請稍後再試。"
        log_meta["error_message"] = error_message

    delivery_unknown = False
    if effects is not None:
        effects.begin("line_reply")
    try:
        await reply_text_message(reply_token, reply_text)
    except Exception:
        delivery_unknown = True
        logger.error("legacy_reply_failed")
        if effects is not None:
            effects.unknown("line_reply")
            raise RuntimeError("legacy_side_effect_outcome_unknown") from None
    else:
        if effects is not None:
            effects.confirmed("line_reply")

    if effects is not None:
        effects.begin("line_query_logs")
    try:
        append_line_query_log(
            line_user_id=user_id,
            member=log_meta.get("member"),
            query_text=message_text or "",
            shrine=log_meta.get("shrine"),
            reply_type=normalize_text(log_meta.get("reply_type")) or "error",
            result_status=normalize_text(log_meta.get("result_status")) or "error",
            query_type=normalize_text(log_meta.get("query_type")) or "unknown",
            target_sheet=normalize_text(log_meta.get("target_sheet")),
            error_message=normalize_text(log_meta.get("error_message")),
            **({"log_id": effects.log_reference()} if effects is not None else {}),
        )
    except Exception:
        delivery_unknown = True
        logger.error("legacy_query_log_failed")
        if effects is not None:
            effects.unknown("line_query_logs")
    else:
        if effects is not None:
            effects.confirmed("line_query_logs")
    if delivery_unknown and effects is not None:
        raise RuntimeError("legacy_side_effect_outcome_unknown")


def build_command_reply(
    command: Command,
    line_user_id: str | None,
) -> tuple[str, dict[str, Any]]:
    if command.command_type == "shrine":
        reply_text, log_meta = build_shrine_query_reply(
            command.query_text,
            line_user_id,
        )
        log_meta["query_type"] = "shrine"
        log_meta["target_sheet"] = "shrines"
        return reply_text, log_meta

    if command.command_type == "help":
        return build_help_reply(), {
            "member": None,
            "shrine": None,
            "reply_type": "help",
            "result_status": "success",
            "query_type": "help",
            "target_sheet": "",
            "error_message": "",
        }

    if command.command_type in {
        "log_recent",
        "log_not_found",
        "backfill_suggestions",
    }:
        return build_query_log_lookup_reply(
            command.command_type,
            line_user_id,
        )

    if command.command_type == "visit":
        return build_shrine_visit_query_reply(
            command.query_text,
            line_user_id,
        )

    if command.command_type == "announcement":
        return build_announcement_query_reply()

    return build_unknown_command_reply(), {
        "member": None,
        "shrine": None,
        "reply_type": "unknown",
        "result_status": "not_found",
        "query_type": "unknown",
        "target_sheet": "",
        "error_message": "",
    }


def build_query_log_lookup_reply(
    command_type: str,
    line_user_id: str | None,
) -> tuple[str, dict[str, Any]]:
    members = read_sheet_records("members")
    member = find_member_by_line_uid(line_user_id, members)

    if not can_view_internal_shrine(member):
        return "此功能限內部人員使用。", {
            "member": member,
            "shrine": None,
            "reply_type": "forbidden",
            "result_status": "forbidden",
            "query_type": command_type,
            "target_sheet": LINE_QUERY_LOG_SHEET,
            "error_message": "",
        }

    records = read_sheet_records(LINE_QUERY_LOG_SHEET)

    if command_type == "backfill_suggestions":
        matched_records = build_backfill_suggestions(records)
        reply_text = build_backfill_suggestions_reply(matched_records)
    elif command_type == "log_not_found":
        matched_records = find_recent_not_found_logs(records)
        reply_text = build_not_found_logs_reply(matched_records)
    else:
        matched_records = find_recent_query_logs(records)
        reply_text = build_recent_query_logs_reply(matched_records)

    result_status = "success" if matched_records else "not_found"
    return reply_text, {
        "member": member,
        "shrine": None,
        "reply_type": command_type,
        "result_status": result_status,
        "query_type": command_type,
        "target_sheet": LINE_QUERY_LOG_SHEET,
        "error_message": "",
    }


def build_shrine_visit_query_reply(
    query_text: str,
    line_user_id: str | None,
) -> tuple[str, dict[str, Any]]:
    members = read_sheet_records("members")
    member = find_member_by_line_uid(line_user_id, members)

    if not can_view_internal_shrine(member):
        return "此功能限內部人員使用。", {
            "member": member,
            "shrine": None,
            "reply_type": "forbidden",
            "result_status": "forbidden",
            "query_type": "visit",
            "target_sheet": "shrine_visits",
            "error_message": "",
        }

    shrines = read_sheet_records("shrines")
    shrine = find_shrine(query_text, shrines, allow_internal=True)

    if not shrine:
        visits = read_sheet_records("shrine_visits")
        shrine_name, matched_visits = find_recent_shrine_visits_by_keyword(
            query_text,
            visits,
        )

        if not matched_visits:
            return build_visit_not_found_reply(query_text), {
                "member": member,
                "shrine": None,
                "reply_type": "not_found",
                "result_status": "not_found",
                "query_type": "visit",
                "target_sheet": "shrine_visits",
                "error_message": "",
            }

        shrine = {"name": shrine_name}
        return build_shrine_visits_reply(shrine, matched_visits), {
            "member": member,
            "shrine": shrine,
            "reply_type": "visit",
            "result_status": "success",
            "query_type": "visit",
            "target_sheet": "shrine_visits",
            "error_message": "",
        }

    visits = read_sheet_records("shrine_visits")
    matched_visits = find_recent_shrine_visits(shrine, visits)

    if not matched_visits:
        return build_visit_not_found_reply(query_text), {
            "member": member,
            "shrine": shrine,
            "reply_type": "not_found",
            "result_status": "not_found",
            "query_type": "visit",
            "target_sheet": "shrine_visits",
            "error_message": "",
        }

    return build_shrine_visits_reply(shrine, matched_visits), {
        "member": member,
        "shrine": shrine,
        "reply_type": "visit",
        "result_status": "success",
        "query_type": "visit",
        "target_sheet": "shrine_visits",
        "error_message": "",
    }


def build_announcement_query_reply() -> tuple[str, dict[str, Any]]:
    announcements = read_sheet_records("announcements")
    latest_announcements = find_latest_announcements(announcements)

    if not latest_announcements:
        return build_announcement_not_found_reply(), {
            "member": None,
            "shrine": None,
            "reply_type": "not_found",
            "result_status": "not_found",
            "query_type": "announcement",
            "target_sheet": "announcements",
            "error_message": "",
        }

    return build_announcements_reply(latest_announcements), {
        "member": None,
        "shrine": None,
        "reply_type": "announcement",
        "result_status": "success",
        "query_type": "announcement",
        "target_sheet": "announcements",
        "error_message": "",
    }
