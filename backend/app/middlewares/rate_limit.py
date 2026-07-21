import time
from typing import Dict, Tuple
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from app.core.config import settings
from app.core.logger import logger

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # In-memory rate limiting map: { ip: (request_count, window_start_timestamp) }
        self.rate_limit_records: Dict[str, Tuple[int, float]] = {}
        self.window_size_seconds = 60
        self.max_requests = settings.RATE_LIMIT_PER_MINUTE

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        
        # Bypass options or health checks if needed
        if request.url.path == "/health" or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            return await call_next(request)

        now = time.time()
        record = self.rate_limit_records.get(client_ip)

        if not record:
            self.rate_limit_records[client_ip] = (1, now)
        else:
            count, start_time = record
            if now - start_time > self.window_size_seconds:
                # Reset window
                self.rate_limit_records[client_ip] = (1, now)
            else:
                if count >= self.max_requests:
                    logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                    return Response(
                        content="Rate limit exceeded. Try again in a minute.",
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                else:
                    self.rate_limit_records[client_ip] = (count + 1, start_time)

        return await call_next(request)
