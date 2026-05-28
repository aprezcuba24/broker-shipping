from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dishka import make_async_container
from dishka.integrations.fastapi import FastapiProvider, setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.lib.event_dispatcher import EventDispatcher
from app.lib.openapi import OPENAPI_TAGS, SWAGGER_UI_PARAMETERS, attach_openapi
from app.lib.providers import AppProvider
from app.lib.register_modules import register_modules
from app.modules import get_app_modules
from app.routes import router as core_router

_lifespan_app_modules = get_app_modules()

_dishka_container = make_async_container(
    AppProvider(),
    *(m.get_provider() for m in _lifespan_app_modules),
    FastapiProvider(),
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    dispatcher = await _dishka_container.get(EventDispatcher)
    dispatcher.bind_container(_dishka_container)
    register_modules(app, _lifespan_app_modules, dispatcher)

    try:
        yield
    finally:
        await _dishka_container.close()


app = FastAPI(
    title="Broker B2B API",
    description="API-first B2B broker (scaffold).",
    version="0.1.0",
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
    swagger_ui_parameters=SWAGGER_UI_PARAMETERS,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_dishka(container=_dishka_container, app=app)

attach_openapi(app)


app.include_router(core_router)
