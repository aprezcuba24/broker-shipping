from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.context import configure_session_maker
from app.db.session import create_async_engine_and_session_maker
from app.lib.events import get_bus
from app.lib.events.registry import register_handlers
from app.lib.exceptions import register_exception_handlers
from app.routes import router as routes_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    engine, session_maker = create_async_engine_and_session_maker(
        settings.database_url
    )
    app.state.engine = engine
    app.state.session_maker = session_maker
    configure_session_maker(session_maker)
    register_handlers(get_bus())
    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(title="Broker API", lifespan=lifespan)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Broker API"}
