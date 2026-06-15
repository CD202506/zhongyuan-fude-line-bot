import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import gspread
from google.oauth2.service_account import Credentials


READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"
LINE_BOT_TABS = (
    "members",
    "shrines",
    "shrine_visits",
    "announcements",
    "line_query_logs",
)
REFERENCE_TABS = (
    "events",
    "finance_logs",
    "settings_lists",
    "field_dictionary",
)
EXPECTED_HEADERS = {
    "members": (
        "member_id",
        "name",
        "role",
        "line_uid",
        "permission_level",
        "active",
        "can_view_internal_shrine",
        "can_view_finance",
        "can_manage_members",
    ),
    "shrines": (
        "shrine_id",
        "name",
        "alias",
        "main_god",
        "public_visible",
        "public_summary",
        "public_notice",
        "internal_reminder",
        "history_context",
        "internal_note",
    ),
    "shrine_visits": (
        "visit_id",
        "record_type",
        "related_shrine_id",
        "related_shrine_name",
        "direction",
        "title",
        "event_date",
        "event_time",
        "location",
        "note",
    ),
    "announcements": (
        "announcement_id",
        "title",
        "category",
        "status",
        "event_date",
        "event_time",
        "location",
        "line_title",
        "line_body",
        "target_audience",
        "publish_to_line",
        "line_publish_status",
        "created_at",
        "updated_at",
        "note",
    ),
    "line_query_logs": (
        "log_id",
        "query_datetime",
        "line_uid",
        "member_id",
        "query_text",
        "query_type",
        "target_sheet",
        "matched_record_id",
        "matched_record_name",
        "result_status",
        "reply_mode",
        "reply_token_used",
        "error_message",
        "source_type",
        "scenario_version",
        "note",
    ),
}
SUPPORTED_FALLBACK_HEADERS = {
    "shrines": ("cultural_taboos",),
    "shrine_visits": (
        "shrine_id",
        "shrine_name",
        "name",
        "visit_date",
        "created_at",
        "source_date",
        "visit_time",
        "time",
        "place",
        "venue",
        "event_title",
        "visit_title",
        "subject",
        "summary",
        "event_name",
        "activity",
        "visit_type",
        "event_type",
        "type",
        "category",
        "visit_direction",
        "description",
        "content",
        "detail",
        "details",
        "notes",
        "remark",
        "remarks",
        "source_note",
        "internal_note",
        "people",
        "people_list",
        "attendees",
        "contact_names",
    ),
    "announcements": (
        "publish_status",
        "publish_date",
        "body",
        "content",
        "description",
        "time",
        "venue",
        "place",
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare V1 and V2 Google Sheets structures using read-only access."
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional Markdown output path. Defaults to stdout.",
    )
    return parser.parse_args()


def get_required_environment() -> dict[str, str]:
    names = (
        "V1_GOOGLE_SHEET_ID",
        "V2_GOOGLE_SHEET_ID",
        "GOOGLE_SERVICE_ACCOUNT_JSON",
    )
    values = {name: os.getenv(name, "").strip() for name in names}
    missing = [name for name, value in values.items() if not value]

    if missing:
        raise RuntimeError(
            "Missing required environment variables: " + ", ".join(missing)
        )

    return values


def build_readonly_client(raw_service_account_json: str) -> gspread.Client:
    try:
        service_account_info = json.loads(raw_service_account_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON"
        ) from exc

    credentials = Credentials.from_service_account_info(
        service_account_info,
        scopes=[READONLY_SCOPE],
    )
    return gspread.authorize(credentials)


def inspect_spreadsheet(
    client: gspread.Client,
    spreadsheet_id: str,
) -> dict[str, dict[str, Any]]:
    spreadsheet = client.open_by_key(spreadsheet_id)
    result = {}

    for worksheet in spreadsheet.worksheets():
        headers = [
            normalize_header(value)
            for value in worksheet.row_values(1)
            if normalize_header(value)
        ]
        first_column = worksheet.col_values(1)
        non_empty_row_count = sum(
            1
            for value in first_column[1:]
            if str(value or "").strip()
        )
        result[worksheet.title] = {
            "headers": headers,
            "non_empty_row_count": non_empty_row_count,
        }

    return result


def build_markdown_report(
    v1: dict[str, dict[str, Any]],
    v2: dict[str, dict[str, Any]],
) -> str:
    lines = [
        "# V1 / V2 Google Sheets Structure Diff",
        "",
        "> Generated with read-only Google Sheets access. Sheet IDs and cell values "
        "are not included.",
        "",
        "## V1 tab 清單",
        "",
        *_tab_table(v1),
        "",
        "## V2 tab 清單",
        "",
        *_tab_table(v2),
        "",
        "## LINE Bot 必要 tab",
        "",
        "| Tab | V1 | V2 |",
        "| --- | --- | --- |",
    ]

    for tab_name in LINE_BOT_TABS:
        lines.append(
            f"| `{tab_name}` | {_presence(v1, tab_name)} | "
            f"{_presence(v2, tab_name)} |"
        )

    lines.extend(
        [
            "",
            "## 必要 tab header 差異",
            "",
        ]
    )

    for tab_name in LINE_BOT_TABS:
        v1_headers = _headers(v1, tab_name)
        v2_headers = _headers(v2, tab_name)
        expected = set(EXPECTED_HEADERS[tab_name])
        lines.extend(
            [
                f"### `{tab_name}`",
                "",
                f"- V1 缺少基準欄位：{_format_values(expected - v1_headers)}",
                f"- V2 缺少基準欄位：{_format_values(expected - v2_headers)}",
                f"- V2 有、V1 沒有：{_format_values(v2_headers - v1_headers)}",
                f"- V1 有、V2 沒有：{_format_values(v1_headers - v2_headers)}",
            ]
        )

        fallbacks = SUPPORTED_FALLBACK_HEADERS.get(tab_name, ())
        if fallbacks:
            lines.append(
                "- 程式容錯欄位："
                + _format_values(
                    {
                        field
                        for field in fallbacks
                        if field in v1_headers or field in v2_headers
                    }
                )
            )
        lines.append("")

    missing_v1_tabs = set(LINE_BOT_TABS) - set(v1)
    lines.extend(
        [
            "## V1 缺少項目",
            "",
            f"- 缺少 tab：{_format_values(missing_v1_tabs)}",
            "- 缺少欄位：見上方各必要 tab 的「V1 缺少基準欄位」。",
            "",
            "## AppSheet 參考 tab",
            "",
            "| Tab | V1 | V2 | LINE Bot |",
            "| --- | --- | --- | --- |",
        ]
    )

    for tab_name in REFERENCE_TABS:
        lines.append(
            f"| `{tab_name}` | {_presence(v1, tab_name)} | "
            f"{_presence(v2, tab_name)} | 目前未直接使用 |"
        )

    lines.extend(
        [
            "",
            "## 資料搬移判斷",
            "",
            "本工具不輸出或分析儲存格內容，因此不會列出任何實際資料列。",
            "",
            "- 不建議搬移：包含「測試」、placeholder、假廟名、測試 LINE 帳號、"
            "draft / archived 公告、來源不明或重複的資料。",
            "- 建議人工複核後搬移：身分與權限已確認的 members、校對過的 shrines、"
            "來源可確認的 shrine_visits、published / ready announcements。",
            "- line_query_logs 預設不整批搬移；如需統計延續，先處理隱私與測試紀錄。",
            "",
            "## 下一步建議",
            "",
            "1. 依本報告確認 V1 缺少的 tab 與欄位。",
            "2. 複製 V1 成 `V1_LINE_TEST`，只在副本補齊結構。",
            "3. 人工檢查 V2 資料內容，排除測試資料後匯入副本。",
            "4. 讓測試服務指向副本，驗證友宮、來訪、公告、查紀錄與補資料建議。",
            "5. 驗證完成後才把相同結構補回 V1，再安排 LINE Bot 正式切換。",
            "",
        ]
    )
    return "\n".join(lines)


def _tab_table(structure: dict[str, dict[str, Any]]) -> list[str]:
    lines = [
        "| Tab | Headers | 第一欄非空資料列數 |",
        "| --- | --- | ---: |",
    ]

    for tab_name, details in structure.items():
        headers = ", ".join(
            f"`{header}`" for header in details.get("headers", [])
        ) or "無"
        lines.append(
            f"| `{tab_name}` | {headers} | "
            f"{details.get('non_empty_row_count', 0)} |"
        )

    if not structure:
        lines.append("| 無 | 無 | 0 |")

    return lines


def _headers(
    structure: dict[str, dict[str, Any]],
    tab_name: str,
) -> set[str]:
    return set(structure.get(tab_name, {}).get("headers", []))


def _presence(
    structure: dict[str, dict[str, Any]],
    tab_name: str,
) -> str:
    return "有" if tab_name in structure else "缺少"


def _format_values(values: set[str]) -> str:
    if not values:
        return "無"

    return "、".join(f"`{value}`" for value in sorted(values))


def normalize_header(value: Any) -> str:
    return str(value or "").lstrip("\ufeff").strip()


def safe_error_message(exc: Exception, secret_values: list[str]) -> str:
    message = " ".join(str(exc).split()) or exc.__class__.__name__

    for secret_value in secret_values:
        if secret_value:
            message = message.replace(secret_value, "<redacted>")

    return message[:500]


def main() -> int:
    args = parse_args()
    environment: dict[str, str] = {}

    try:
        environment = get_required_environment()
        client = build_readonly_client(
            environment["GOOGLE_SERVICE_ACCOUNT_JSON"]
        )
        v1 = inspect_spreadsheet(
            client,
            environment["V1_GOOGLE_SHEET_ID"],
        )
        v2 = inspect_spreadsheet(
            client,
            environment["V2_GOOGLE_SHEET_ID"],
        )
        report = build_markdown_report(v1, v2)

        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(report, encoding="utf-8")
            print(f"Structure report written to: {args.output}")
        else:
            print(report)

        return 0
    except Exception as exc:
        print(
            "Structure comparison failed: "
            + safe_error_message(exc, list(environment.values())),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
