import json
import os
import re
import sys
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from xml.etree import ElementTree


EXPECTED_SPREADSHEET_TITLE = "中原福德宮_AppSheet_0612"
SOURCE_WORKBOOK = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "sheets_exports"
    / "V1_LINE_TEST_中原福德宮_AppSheet_0612.xlsx"
)
READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"
WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
ALLOWED_TABS = ("announcements", "shrine_visits", "line_query_logs")
ANNOUNCEMENT_IDS = ("A-0001",)
VISIT_IDS = ("V-0002", "V-0003")
LOG_HEADERS = (
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
)
UNTOUCHED_TABS = (
    "members",
    "shrines",
    "events",
    "finance_logs",
    "settings_lists",
    "field_dictionary",
    "README_V2",
    "change_log",
    "v2_migration_checklist",
)
_MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
_PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


@dataclass
class SheetSnapshot:
    title: str
    headers: list[str]
    rows: list[list[str]]


@dataclass
class SheetPatch:
    title: str
    create: bool
    original_headers: list[str]
    original_row_count: int
    target_headers: list[str]
    target_rows: list[list[str]]
    added_ids: list[str] = field(default_factory=list)
    skipped_ids: list[str] = field(default_factory=list)
    missing_headers: list[str] = field(default_factory=list)


@dataclass
class PatchPlan:
    spreadsheet_title: str
    patches: list[SheetPatch]
    blockers: list[str] = field(default_factory=list)


def get_environment() -> dict[str, str]:
    names = ("V1_GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON")
    values = {name: os.getenv(name, "").strip() for name in names}
    missing = [name for name, value in values.items() if not value]

    if missing:
        raise RuntimeError(
            "Missing required environment variables: " + ", ".join(missing)
        )

    values["APPLY_V1_PATCH"] = os.getenv("APPLY_V1_PATCH", "").strip()
    return values


def is_apply_enabled(value: str) -> bool:
    return value.lower() == "true"


def build_google_client(
    raw_service_account_json: str,
    *,
    apply_enabled: bool,
) -> Any:
    import gspread
    from google.oauth2.service_account import Credentials

    try:
        service_account_info = json.loads(raw_service_account_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON"
        ) from exc

    credentials = Credentials.from_service_account_info(
        service_account_info,
        scopes=[WRITE_SCOPE if apply_enabled else READONLY_SCOPE],
    )
    return gspread.authorize(credentials)


def load_source_sheets(path: Path = SOURCE_WORKBOOK) -> dict[str, SheetSnapshot]:
    if not path.is_file():
        raise RuntimeError(f"Source workbook not found: {path}")

    workbook = _read_xlsx(path)
    missing = [tab for tab in ALLOWED_TABS if tab not in workbook]

    if missing:
        raise RuntimeError(
            "Source workbook missing required tabs: " + ", ".join(missing)
        )

    source = {tab: workbook[tab] for tab in ALLOWED_TABS}
    _validate_source(source)
    return source


def read_remote_sheets(spreadsheet: Any) -> dict[str, SheetSnapshot]:
    snapshots = {}

    for worksheet in spreadsheet.worksheets():
        if worksheet.title not in ALLOWED_TABS:
            continue

        values = _normalize_matrix(worksheet.get_all_values())
        snapshots[worksheet.title] = SheetSnapshot(
            title=worksheet.title,
            headers=values[0] if values else [],
            rows=_non_empty_rows(values[1:]),
        )

    return snapshots


def build_patch_plan(
    spreadsheet_title: str,
    remote: dict[str, SheetSnapshot],
    source: dict[str, SheetSnapshot],
) -> PatchPlan:
    blockers = []

    if spreadsheet_title != EXPECTED_SPREADSHEET_TITLE:
        blockers.append(
            "Spreadsheet title mismatch; expected "
            f"{EXPECTED_SPREADSHEET_TITLE!r}, got {spreadsheet_title!r}."
        )

    patches = [
        _plan_announcements(remote.get("announcements"), source["announcements"]),
        _plan_upgrade_sheet(
            "shrine_visits",
            remote.get("shrine_visits"),
            source["shrine_visits"],
            id_header="visit_id",
            selected_ids=VISIT_IDS,
        ),
        _plan_upgrade_sheet(
            "line_query_logs",
            remote.get("line_query_logs"),
            source["line_query_logs"],
            id_header="log_id",
            selected_ids=(),
            legacy_aliases={"result_status": "result"},
            expected_headers=list(LOG_HEADERS),
        ),
    ]

    if remote.get("shrine_visits") is None:
        blockers.append("Required existing tab not found: shrine_visits")

    if remote.get("line_query_logs") is None:
        blockers.append("Required existing tab not found: line_query_logs")

    return PatchPlan(
        spreadsheet_title=spreadsheet_title,
        patches=patches,
        blockers=blockers,
    )


def print_plan(plan: PatchPlan, apply_enabled: bool) -> None:
    mode = "APPLY" if apply_enabled else "DRY-RUN"
    print(f"[v1_patch] mode={mode}")
    print(f"[v1_patch] target_title={plan.spreadsheet_title}")
    print(
        "[v1_patch] allowed_tabs=" + ", ".join(ALLOWED_TABS)
    )
    print(
        "[v1_patch] untouched_tabs=" + ", ".join(UNTOUCHED_TABS)
    )

    created = [patch.title for patch in plan.patches if patch.create]
    upgraded = [
        patch.title
        for patch in plan.patches
        if not patch.create and patch.original_headers != patch.target_headers
    ]
    print(
        "[v1_patch] tabs_to_create=" + (", ".join(created) or "none")
    )
    print(
        "[v1_patch] tabs_to_upgrade=" + (", ".join(upgraded) or "none")
    )

    for patch in plan.patches:
        if patch.create:
            action = "create"
        elif _patch_needs_write(patch):
            action = "update"
        else:
            action = "no_change"
        print(
            f"[v1_patch] sheet={patch.title}, action={action}, "
            f"headers={len(patch.target_headers)}, "
            f"rows={len(patch.target_rows)}, "
            f"missing_headers={_list_or_none(patch.missing_headers)}, "
            f"add_ids={_list_or_none(patch.added_ids)}, "
            f"skip_ids={_list_or_none(patch.skipped_ids)}"
        )

    if plan.blockers:
        print("[v1_patch] blockers:")
        for blocker in plan.blockers:
            print(f"  - {blocker}")
    else:
        print("[v1_patch] blockers=none")

    if not apply_enabled:
        print("[v1_patch] dry-run complete; no Google Sheets writes performed.")


def apply_patch_plan(spreadsheet: Any, plan: PatchPlan) -> None:
    if plan.blockers:
        raise RuntimeError("Patch plan has blockers; refusing to apply")

    _preflight_remote_state(spreadsheet, plan)

    completed = []

    for patch in plan.patches:
        if not _patch_needs_write(patch):
            continue

        if patch.create:
            worksheet = spreadsheet.add_worksheet(
                title=patch.title,
                rows=max(100, len(patch.target_rows) + 10),
                cols=len(patch.target_headers),
            )
        else:
            worksheet = spreadsheet.worksheet(patch.title)

        values = [patch.target_headers, *patch.target_rows]
        end_cell = _a1_cell(len(values), len(patch.target_headers))
        worksheet.update(
            values=values,
            range_name=f"A1:{end_cell}",
            value_input_option="USER_ENTERED",
        )
        completed.append(patch.title)

    print("[v1_patch] apply complete")
    print(
        "[v1_patch] completed_tabs="
        + (_list_or_none(completed))
    )
    added_ids = [
        item
        for patch in plan.patches
        for item in patch.added_ids
    ]
    skipped_ids = [
        item
        for patch in plan.patches
        for item in patch.skipped_ids
    ]
    print("[v1_patch] added_ids=" + _list_or_none(added_ids))
    print("[v1_patch] skipped_existing_ids=" + _list_or_none(skipped_ids))
    print("[v1_patch] untouched_tabs=" + ", ".join(UNTOUCHED_TABS))


def _plan_announcements(
    remote: SheetSnapshot | None,
    source: SheetSnapshot,
) -> SheetPatch:
    selected = _select_source_rows(
        source,
        id_header="announcement_id",
        selected_ids=ANNOUNCEMENT_IDS,
    )

    if remote is None:
        return SheetPatch(
            title="announcements",
            create=True,
            original_headers=[],
            original_row_count=0,
            target_headers=source.headers,
            target_rows=selected,
            added_ids=list(ANNOUNCEMENT_IDS),
            missing_headers=source.headers,
        )

    _validate_unique_headers(remote)
    target_headers = [
        *remote.headers,
        *[header for header in source.headers if header not in remote.headers],
    ]
    existing_records = _records(remote)
    existing_ids = {
        record.get("announcement_id", "")
        for record in existing_records
        if record.get("announcement_id", "")
    }
    target_rows = [
        _record_to_row(record, target_headers)
        for record in existing_records
    ]
    added_ids = []
    skipped_ids = []

    for row in selected:
        record = dict(zip(source.headers, row))
        record_id = record["announcement_id"]

        if record_id in existing_ids:
            skipped_ids.append(record_id)
            continue

        target_rows.append(_record_to_row(record, target_headers))
        added_ids.append(record_id)

    return SheetPatch(
        title="announcements",
        create=False,
        original_headers=remote.headers,
        original_row_count=len(remote.rows),
        target_headers=target_headers,
        target_rows=target_rows,
        added_ids=added_ids,
        skipped_ids=skipped_ids,
        missing_headers=[
            header for header in source.headers if header not in remote.headers
        ],
    )


def _plan_upgrade_sheet(
    title: str,
    remote: SheetSnapshot | None,
    source: SheetSnapshot,
    *,
    id_header: str,
    selected_ids: tuple[str, ...],
    legacy_aliases: dict[str, str] | None = None,
    expected_headers: list[str] | None = None,
) -> SheetPatch:
    target_headers = expected_headers or source.headers

    if remote is None:
        return SheetPatch(
            title=title,
            create=False,
            original_headers=[],
            original_row_count=0,
            target_headers=target_headers,
            target_rows=[],
        )

    _validate_unique_headers(remote)
    legacy_aliases = legacy_aliases or {}
    existing_records = _records(remote)
    target_rows = [
        _record_to_row(record, target_headers, legacy_aliases)
        for record in existing_records
    ]
    existing_ids = {
        record.get(id_header, "")
        for record in existing_records
        if record.get(id_header, "")
    }
    added_ids = []
    skipped_ids = []

    for row in _select_source_rows(source, id_header, selected_ids):
        record = dict(zip(source.headers, row))
        record_id = record[id_header]

        if record_id in existing_ids:
            skipped_ids.append(record_id)
            continue

        target_rows.append(_record_to_row(record, target_headers))
        added_ids.append(record_id)

    return SheetPatch(
        title=title,
        create=False,
        original_headers=remote.headers,
        original_row_count=len(remote.rows),
        target_headers=target_headers,
        target_rows=target_rows,
        added_ids=added_ids,
        skipped_ids=skipped_ids,
        missing_headers=[
            header for header in target_headers if header not in remote.headers
        ],
    )


def _preflight_remote_state(spreadsheet: Any, plan: PatchPlan) -> None:
    worksheets = {worksheet.title: worksheet for worksheet in spreadsheet.worksheets()}

    if spreadsheet.title != EXPECTED_SPREADSHEET_TITLE:
        raise RuntimeError("Spreadsheet title changed; refusing to apply")

    for patch in plan.patches:
        worksheet = worksheets.get(patch.title)

        if patch.create:
            if worksheet is not None:
                raise RuntimeError(
                    f"Remote state changed: {patch.title} now exists"
                )
            continue

        if worksheet is None:
            raise RuntimeError(
                f"Remote state changed: {patch.title} is missing"
            )

        values = _normalize_matrix(worksheet.get_all_values())
        headers = values[0] if values else []
        row_count = len(_non_empty_rows(values[1:]))

        if headers != patch.original_headers or row_count != patch.original_row_count:
            raise RuntimeError(
                f"Remote state changed after planning: {patch.title}"
            )


def _validate_source(source: dict[str, SheetSnapshot]) -> None:
    for snapshot in source.values():
        _validate_unique_headers(snapshot)

    if source["line_query_logs"].headers != list(LOG_HEADERS):
        raise RuntimeError("Source line_query_logs headers are not the expected 16 columns")

    announcement_records = _records(source["announcements"])
    announcements = {
        record.get("announcement_id", ""): record
        for record in announcement_records
    }
    announcement = announcements.get("A-0001")

    if not announcement or announcement.get("status", "").lower() != "published":
        raise RuntimeError("Source A-0001 is missing or is not published")

    for forbidden_id in ("A-0002",):
        if forbidden_id in ANNOUNCEMENT_IDS:
            raise RuntimeError(f"Forbidden announcement selected: {forbidden_id}")

    visit_ids = {
        record.get("visit_id", "")
        for record in _records(source["shrine_visits"])
    }
    missing_visits = [visit_id for visit_id in VISIT_IDS if visit_id not in visit_ids]

    if missing_visits:
        raise RuntimeError(
            "Source missing selected shrine visits: " + ", ".join(missing_visits)
        )


def _validate_unique_headers(snapshot: SheetSnapshot) -> None:
    if not snapshot.headers:
        raise RuntimeError(f"{snapshot.title} has no header row")

    duplicates = sorted(
        {
            header
            for header in snapshot.headers
            if snapshot.headers.count(header) > 1
        }
    )
    blank_headers = [index + 1 for index, header in enumerate(snapshot.headers) if not header]

    if duplicates:
        raise RuntimeError(
            f"{snapshot.title} has duplicate headers: {', '.join(duplicates)}"
        )

    if blank_headers:
        raise RuntimeError(
            f"{snapshot.title} has blank headers at columns: "
            + ", ".join(map(str, blank_headers))
        )


def _select_source_rows(
    source: SheetSnapshot,
    id_header: str,
    selected_ids: tuple[str, ...],
) -> list[list[str]]:
    if not selected_ids:
        return []

    try:
        id_index = source.headers.index(id_header)
    except ValueError as exc:
        raise RuntimeError(
            f"Source {source.title} missing ID header: {id_header}"
        ) from exc

    by_id = {
        row[id_index]: row
        for row in source.rows
        if len(row) > id_index and row[id_index]
    }
    missing = [record_id for record_id in selected_ids if record_id not in by_id]

    if missing:
        raise RuntimeError(
            f"Source {source.title} missing IDs: " + ", ".join(missing)
        )

    return [by_id[record_id] for record_id in selected_ids]


def _records(snapshot: SheetSnapshot) -> list[dict[str, str]]:
    return [
        {
            header: row[index] if index < len(row) else ""
            for index, header in enumerate(snapshot.headers)
        }
        for row in snapshot.rows
    ]


def _record_to_row(
    record: dict[str, str],
    target_headers: list[str],
    aliases: dict[str, str] | None = None,
) -> list[str]:
    aliases = aliases or {}
    result = []

    for header in target_headers:
        value = record.get(header, "")

        if not value and header in aliases:
            value = record.get(aliases[header], "")

        result.append(value)

    return result


def _normalize_matrix(values: list[list[Any]]) -> list[list[str]]:
    matrix = [
        [str(value if value is not None else "") for value in row]
        for row in values
    ]

    if matrix:
        matrix[0] = [normalize_text(value) for value in matrix[0]]

    return matrix


def _non_empty_rows(rows: list[list[str]]) -> list[list[str]]:
    return [
        row
        for row in rows
        if any(str(value or "").strip() for value in row)
    ]


def normalize_text(value: Any) -> str:
    return str(value or "").lstrip("\ufeff").strip()


def safe_error_message(exc: Exception, secrets: list[str]) -> str:
    message = " ".join(str(exc).split()) or exc.__class__.__name__

    for secret in secrets:
        if secret:
            message = message.replace(secret, "<redacted>")

    message = re.sub(
        r'(?i)(private[_ -]?key)(["\']?\s*[:=]\s*)([^,\s}]+)',
        r"\1\2<redacted>",
        message,
    )
    return message[:500]


def _list_or_none(values: list[str]) -> str:
    return ", ".join(values) if values else "none"


def _patch_needs_write(patch: SheetPatch) -> bool:
    return bool(
        patch.create
        or patch.original_headers != patch.target_headers
        or patch.added_ids
    )


def _a1_cell(row: int, column: int) -> str:
    letters = ""
    current = column

    while current:
        current, remainder = divmod(current - 1, 26)
        letters = chr(65 + remainder) + letters

    return f"{letters}{row}"


def _read_xlsx(path: Path) -> dict[str, SheetSnapshot]:
    with zipfile.ZipFile(path) as archive:
        shared_strings = _read_shared_strings(archive)
        workbook_root = ElementTree.fromstring(
            archive.read("xl/workbook.xml")
        )
        relationship_root = ElementTree.fromstring(
            archive.read("xl/_rels/workbook.xml.rels")
        )
        targets = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationship_root.findall(
                f"{{{_PACKAGE_REL_NS}}}Relationship"
            )
        }
        result = {}

        for sheet in workbook_root.findall(
            f".//{{{_MAIN_NS}}}sheet"
        ):
            title = sheet.attrib["name"]
            relationship_id = sheet.attrib[f"{{{_REL_NS}}}id"]
            target = targets[relationship_id].lstrip("/")
            member = target if target.startswith("xl/") else f"xl/{target}"
            values = _read_worksheet(archive, member, shared_strings)
            result[title] = SheetSnapshot(
                title=title,
                headers=(
                    [normalize_text(value) for value in values[0]]
                    if values
                    else []
                ),
                rows=_non_empty_rows(values[1:]),
            )

        return result


def _read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    return [
        "".join(node.text or "" for node in item.iter(f"{{{_MAIN_NS}}}t"))
        for item in root.findall(f"{{{_MAIN_NS}}}si")
    ]


def _read_worksheet(
    archive: zipfile.ZipFile,
    member: str,
    shared_strings: list[str],
) -> list[list[str]]:
    root = ElementTree.fromstring(archive.read(member))
    rows = []

    for row_node in root.findall(f".//{{{_MAIN_NS}}}row"):
        cells: dict[int, str] = {}

        for cell in row_node.findall(f"{{{_MAIN_NS}}}c"):
            reference = cell.attrib.get("r", "")
            column = _column_index(reference)
            cell_type = cell.attrib.get("t", "")
            value_node = cell.find(f"{{{_MAIN_NS}}}v")

            if cell_type == "inlineStr":
                value = "".join(
                    node.text or ""
                    for node in cell.iter(f"{{{_MAIN_NS}}}t")
                )
            elif value_node is None:
                value = ""
            elif cell_type == "s":
                value = shared_strings[int(value_node.text or "0")]
            elif cell_type == "b":
                value = "TRUE" if value_node.text == "1" else "FALSE"
            else:
                value = value_node.text or ""

            cells[column] = str(value)

        if cells:
            width = max(cells) + 1
            rows.append(
                _trim_trailing_blanks(
                    [cells.get(index, "") for index in range(width)]
                )
            )
        else:
            rows.append([])

    return rows


def _column_index(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference.upper())

    if not letters:
        return 0

    value = 0
    for character in letters.group(0):
        value = value * 26 + ord(character) - 64
    return value - 1


def _trim_trailing_blanks(row: list[str]) -> list[str]:
    result = list(row)

    while result and not result[-1]:
        result.pop()

    return result


def main() -> int:
    environment: dict[str, str] = {}

    try:
        environment = get_environment()
        apply_enabled = is_apply_enabled(environment["APPLY_V1_PATCH"])
        source = load_source_sheets()
        client = build_google_client(
            environment["GOOGLE_SERVICE_ACCOUNT_JSON"],
            apply_enabled=apply_enabled,
        )
        spreadsheet = client.open_by_key(environment["V1_GOOGLE_SHEET_ID"])
        remote = read_remote_sheets(spreadsheet)
        plan = build_patch_plan(spreadsheet.title, remote, source)
        print_plan(plan, apply_enabled)

        if plan.blockers:
            raise RuntimeError("Blocking safety checks failed")

        if apply_enabled:
            apply_patch_plan(spreadsheet, plan)

        return 0
    except Exception as exc:
        print(
            "[v1_patch] failed: "
            + safe_error_message(exc, list(environment.values())),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
