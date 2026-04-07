from __future__ import annotations

import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    api_key: str = Field(alias="AA_TO_NT_API_KEY")
    username: str = Field(alias="USERNAME")
    password: str = Field(alias="PASSWORD")
    environment: str = os.environ.get("ENVIRONMENT", "development")


@lru_cache(maxsize=1)
def load_settings() -> AppSettings:
    return AppSettings()  # pyright: ignore[reportCallIssue]
