from __future__ import annotations

import base64
import io

import pandas as pd

from aa_to_nt_backend.defaults import build_default_input_tag
from aa_to_nt_backend.models import TransformWorkbookRequest
from aa_to_nt_backend.service import transform_workbook


def test_transform_workbook_returns_expected_sheet_contract() -> None:
    input_frame = pd.DataFrame(
        [
            {
                "AA452_7merSubs": "AAAAAAA",
                "AA588_UpstreamFlank": "AA",
                "AA588_7merInsert": "AAAAAAA",
                "AA588_DownstreamFlank": "AA",
            }
        ]
    )
    csv_bytes = input_frame.to_csv(index=False).encode("utf-8")
    response = transform_workbook(
        TransformWorkbookRequest(
            input_file_name="input.csv",
            input_file_media_type="text/csv",
            input_file_base64=base64.b64encode(csv_bytes).decode("utf-8"),
            input_tag=build_default_input_tag(),
            input_share_url="https://example.com/aa-to-nt?inputTag=demo",
        )
    )

    workbook_bytes = base64.b64decode(response.output_file_base64)
    workbook = pd.ExcelFile(io.BytesIO(workbook_bytes))

    assert response.output_file_name == "output_input.xlsx"
    assert set(workbook.sheet_names) >= {
        "Output_Design_ID1",
        "OUTPUT_ALL_region_version_cols",
        "OUTPUT_ALL_region_cols",
        "OUTPUT_ALL_tall",
        "OUTPUT_basic_tall",
        "OUTPUT_annotated",
        "Input_CodonMaps",
        "Input_Regions",
        "Input_Designs",
        "Input_tag",
        "Input_Sequences",
    }

    input_tag_sheet = pd.read_excel(io.BytesIO(workbook_bytes), sheet_name="Input_tag")
    assert (
        input_tag_sheet.loc[0, "Input_url"]
        == "https://example.com/aa-to-nt?inputTag=demo"
    )
