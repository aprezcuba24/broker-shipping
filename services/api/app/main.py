from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.redis = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        yield
    finally:
        await app.state.redis.aclose()


app = FastAPI(
    title="Broker B2B API",
    description="API-first B2B broker (scaffold).",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict[str, str]:
    try:
        pong = await app.state.redis.ping()
    except Exception:
        pong = False
    return {
        "status": "ok" if pong else "degraded",
        "redis": "ok" if pong else "unreachable",
    }


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "broker-api", "docs": "/docs"}
