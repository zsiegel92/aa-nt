from __future__ import annotations

import base64

from aa_to_nt_backend.models import TransformWorkbookRequest, TransformWorkbookResponse
from aa_to_nt_backend.transformer import transform_input_dataframe
from aa_to_nt_backend.workbook import (
    EXCEL_MEDIA_TYPE,
    build_output_file_name,
    read_input_dataframe,
    write_workbook_bytes,
)


def transform_workbook(request: TransformWorkbookRequest) -> TransformWorkbookResponse:
    input_frame = read_input_dataframe(request)
    worksheets = transform_input_dataframe(input_frame, request.input_tag)
    input_tag_sheet = worksheets["Input_tag"].copy()
    input_tag_sheet["Input_url"] = request.input_share_url or ""
    worksheets["Input_tag"] = input_tag_sheet
    worksheets["Input_Sequences"] = input_frame
    output_bytes = write_workbook_bytes(worksheets)
    return TransformWorkbookResponse(
        output_file_name=build_output_file_name(request.input_file_name),
        output_file_media_type=EXCEL_MEDIA_TYPE,
        output_file_base64=base64.b64encode(output_bytes).decode("utf-8"),
    )
