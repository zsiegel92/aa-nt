from __future__ import annotations

from fastapi import Depends, FastAPI

from aa_to_nt_backend.defaults import build_default_input_tag
from aa_to_nt_backend.models import InputTag, TransformWorkbookRequest, TransformWorkbookResponse
from aa_to_nt_backend.security import require_api_key
from aa_to_nt_backend.service import transform_workbook

webapp = FastAPI(
    title="AA to NT API",
    dependencies=[Depends(require_api_key)],
)


@webapp.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@webapp.get("/defaults")
async def defaults() -> InputTag:
    return build_default_input_tag()


@webapp.post("/transform-workbook")
async def transform_workbook_endpoint(
    request: TransformWorkbookRequest,
) -> TransformWorkbookResponse:
    return transform_workbook(request)
