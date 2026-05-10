from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from app.config import settings
from app.lib.event_dispatcher import EventDispatcher
from app.lib.register_modules import register_modules
from app.modules import get_app_modules
from app.routes import router as core_router


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

dispatcher = EventDispatcher()
app.state.dispatcher = dispatcher
app_modules = get_app_modules()
register_modules(app, app_modules, dispatcher)

app.include_router(core_router)
