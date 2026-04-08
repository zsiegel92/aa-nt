from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook

OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "simple-default-input.xlsx"
SHEET_NAME = "Sheet1"

HEADERS = [
    "sample_id",
    "AA452_7merSubs",
    "AA588_UpstreamFlank",
    "AA588_7merInsert",
    "AA588_DownstreamFlank",
]

ROWS = [
    ["sample-001", "AAAAAAA", "AA", "AAAAAAA", "AA"],
    ["sample-002", "RSTVWYA", "GH", "LMNPQRS", "DE"],
    ["sample-003", "CDEFGHI", "IK", "TVWYACD", "LM"],
    ["sample-004", "KLMNPQR", "NP", "EFGHIKL", "QR"],
    ["sample-005", "TVWYACD", "ST", "RSTVWYA", "GH"],
    ["sample-006", "GHIKLMN", "VW", "CDEFGHI", "NP"],
]


def build_workbook() -> Workbook:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = SHEET_NAME
    worksheet.append(HEADERS)
    for row in ROWS:
        worksheet.append(row)
    return workbook


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    workbook = build_workbook()
    workbook.save(OUTPUT_PATH)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
