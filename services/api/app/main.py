from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dishka import make_async_container
from dishka.integrations.fastapi import FastapiProvider, setup_dishka
from fastapi import FastAPI

from app.lib.event_dispatcher import EventDispatcher
from app.lib.providers import AppProvider
from app.lib.register_modules import register_modules
from app.modules import get_app_modules
from app.routes import router as core_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app_modules = get_app_modules()
    container = make_async_container(
        AppProvider(),
        *(m.get_provider() for m in app_modules),
        FastapiProvider(),
    )
    setup_dishka(container=container, app=app)

    dispatcher = await container.get(EventDispatcher)
    dispatcher.bind_container(container)
    register_modules(app, app_modules, dispatcher)

    try:
        yield
    finally:
        await container.close()


app = FastAPI(
    title="Broker B2B API",
    description="API-first B2B broker (scaffold).",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(core_router)
