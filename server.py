from __future__ import annotations

import modal
from fastapi import FastAPI

from aa_to_nt_backend.app import webapp

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("uv")
    .uv_sync()
    .add_local_python_source("aa_to_nt_backend", copy=True)
)

app = modal.App(
    name="aa-to-nt-app",
    image=image,
)


@app.function()
@modal.asgi_app()
def serve_webapp() -> FastAPI:
    return webapp
