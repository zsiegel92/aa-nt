from __future__ import annotations

import io
from pathlib import Path

import pandas as pd

from aa_to_nt_backend.models import TransformWorkbookRequest


EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def read_input_dataframe(request: TransformWorkbookRequest) -> pd.DataFrame:
    file_name = request.input_file_name.lower()
    file_bytes = request.decoded_file_bytes()
    if file_name.endswith(".csv") or request.input_file_media_type == "text/csv":
        return pd.read_csv(io.BytesIO(file_bytes)).fillna("")
    if file_name.endswith(".txt"):
        return pd.read_csv(io.BytesIO(file_bytes)).fillna("")
    if file_name.endswith(".xlsx") or request.input_file_media_type == EXCEL_MEDIA_TYPE:
        workbook = io.BytesIO(file_bytes)
        try:
            return pd.read_excel(workbook, sheet_name="Input_Sequences").fillna("")
        except ValueError:
            workbook.seek(0)
            return pd.read_excel(workbook).fillna("")
    raise ValueError("Only .csv, .txt, and .xlsx inputs are supported")


def build_output_file_name(input_file_name: str) -> str:
    stem = Path(input_file_name).stem
    return f"output_{stem}.xlsx"


def write_workbook_bytes(worksheets: dict[str, pd.DataFrame]) -> bytes:
    workbook_bytes = io.BytesIO()
    with pd.ExcelWriter(
        workbook_bytes,
        engine="xlsxwriter",
        engine_kwargs={"options": {"strings_to_urls": False}},
    ) as writer:
        for worksheet_name, worksheet_frame in worksheets.items():
            worksheet_frame.to_excel(writer, sheet_name=worksheet_name[:31], index=False)
    return workbook_bytes.getvalue()
