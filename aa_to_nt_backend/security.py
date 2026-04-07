from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from aa_to_nt_backend.settings import load_settings

http_bearer = HTTPBearer()


def require_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> bool:
    settings = load_settings()
    if credentials.credentials != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True
