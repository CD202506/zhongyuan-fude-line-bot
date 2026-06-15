import json
import os
from typing import Any

import gspread


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
    spreadsheet = get_spreadsheet()
    worksheet = spreadsheet.worksheet(sheet_name)
    return worksheet.get_all_records()


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
