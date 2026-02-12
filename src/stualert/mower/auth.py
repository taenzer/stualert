import asyncio
from datetime import datetime, timedelta
import os
from typing import Optional
import logging
from pydantic import BaseModel

import httpx

logger = logging.getLogger(__name__)
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int  # Sekunden
    scope: str
    provider: str
    user_id: str

class HusqvarnaAuth:

    def __init__(self) -> None:
        self.client_id = os.environ.get("HUSQVARNA_CLIENT_ID")
        self.client_secret = os.environ.get("HUSQVARNA_CLIENT_SECRET")
        self.token_url = os.environ.get("HUSQVARNA_TOKEN_URL")

        self._token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        self._lock = asyncio.Lock()

    async def get_token(self) -> str:
        async with self._lock:
            if self._is_token_valid():
                logger.debug("Using cached token")
                return self._token  # type: ignore
            
            logger.info("Token expired or not available, fetching new token")
            await self._fetch_new_token()
            return self._token  # type: ignore
    
    def _is_token_valid(self) -> bool:
        if self._token is None or self._token_expires_at is None:
            return False
        
        # Token gilt als ungültig wenn weniger als 60 Sekunden verbleiben
        return datetime.now() < (self._token_expires_at - timedelta(seconds=60))
    
    async def _fetch_new_token(self) -> None:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.token_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    timeout=10.0,
                )
                response.raise_for_status()
                
                token_data = TokenResponse(**response.json())
                
                self._token = token_data.access_token
                self._token_expires_at = datetime.now() + timedelta(
                    seconds=token_data.expires_in
                )
                
                logger.info(
                    f"Successfully obtained new token, expires in {token_data.expires_in}s "
                    f"(at {self._token_expires_at.isoformat()})"
                )
                
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error fetching token: {e.response.status_code} - {e.response.text}")
                raise Exception(f"Failed to obtain access token: {e.response.status_code}") from e
            except httpx.RequestError as e:
                logger.error(f"Network error fetching token: {e}")
                raise Exception("Network error while obtaining access token") from e
            except Exception as e:
                logger.error(f"Unexpected error fetching token: {e}")
                raise
    
    async def get_auth_header(self) -> dict[str, str]:
        token = await self.get_token()
        return {"Authorization": f"Bearer {token}"}
    
    async def force_refresh(self) -> None:
        async with self._lock:
            logger.info("Forcing token refresh")
            await self._fetch_new_token()
    
    def invalidate_token(self) -> None:
        logger.info("Invalidating current token")
        self._token = None
        self._token_expires_at = None