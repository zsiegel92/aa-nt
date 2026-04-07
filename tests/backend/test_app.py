from __future__ import annotations

import base64

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from aa_to_nt_backend.app import webapp
from aa_to_nt_backend.defaults import build_default_input_tag
from aa_to_nt_backend.settings import load_settings


def build_authorized_client(monkeypatch: MonkeyPatch) -> TestClient:
    del monkeypatch
    load_settings.cache_clear()
    return TestClient(webapp)


def test_healthz_requires_bearer_token(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("AA_TO_NT_API_KEY", "test-key")
    client = build_authorized_client(monkeypatch)

    response = client.get("/healthz")

    assert response.status_code == 401


def test_healthz_returns_ok_when_authorized(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("AA_TO_NT_API_KEY", "test-key")
    client = build_authorized_client(monkeypatch)

    response = client.get("/healthz", headers={"Authorization": "Bearer test-key"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_transform_workbook_endpoint_round_trip(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("AA_TO_NT_API_KEY", "test-key")
    client = build_authorized_client(monkeypatch)

    payload = {
        "input_file_name": "input.csv",
        "input_file_media_type": "text/csv",
        "input_file_base64": base64.b64encode(
            b"AA452_7merSubs,AA588_UpstreamFlank,AA588_7merInsert,AA588_DownstreamFlank\nAAAAAAA,AA,AAAAAAA,AA\n"
        ).decode("utf-8"),
        "input_tag": build_default_input_tag().model_dump(mode="json"),
        "input_share_url": "https://example.com/aa-to-nt",
    }

    response = client.post(
        "/transform-workbook",
        headers={"Authorization": "Bearer test-key"},
        json=payload,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["output_file_name"] == "output_input.xlsx"
    assert body["output_file_base64"]
