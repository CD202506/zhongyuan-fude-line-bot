import json
import os
import time
from typing import Any

import gspread

from config import get_sheets_cache_ttl_seconds


_CACHEABLE_SHEETS = {"shrines", "members"}
_sheet_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}


def get_google_sheet_client() -> gspread.Client:
    raw_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

    if not raw_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not set")

    try:
        service_account_info = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON") from exc

    return gspread.service_account_from_dict(service_account_info)


def get_spreadsheet() -> gspread.Spreadsheet:
    sheet_id = os.getenv("GOOGLE_SHEET_ID")

    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is not set")

    client = get_google_sheet_client()
    return client.open_by_key(sheet_id)


def read_sheet_records(sheet_name: str) -> list[dict[str, Any]]:
    if sheet_name not in _CACHEABLE_SHEETS:
        return _read_sheet_records_uncached(sheet_name)

    now = time.monotonic()
    cached = _sheet_cache.get(sheet_name)

    if cached and cached[0] > now:
        return cached[1]

    _sheet_cache.pop(sheet_name, None)
    records = _read_sheet_records_uncached(sheet_name)
    ttl_seconds = get_sheets_cache_ttl_seconds()

    if ttl_seconds > 0:
        _sheet_cache[sheet_name] = (time.monotonic() + ttl_seconds, records)

    return records


def _read_sheet_records_uncached(sheet_name: str) -> list[dict[str, Any]]:
    spreadsheet = get_spreadsheet()
    worksheet = spreadsheet.worksheet(sheet_name)
    return worksheet.get_all_records()


def clear_sheet_cache() -> None:
    _sheet_cache.clear()


def append_sheet_record_by_headers(
    sheet_name: str,
    record: dict[str, Any],
) -> None:
    """
    Append a row by matching record keys to the sheet's header row.
    """
    spreadsheet = get_spreadsheet()
    worksheet = spreadsheet.worksheet(sheet_name)
    headers = worksheet.row_values(1)
    row_values = [record.get(header, "") for header in headers]
    worksheet.append_row(row_values, value_input_option="USER_ENTERED")
