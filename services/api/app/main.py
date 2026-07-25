from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.db.session import create_async_engine_and_session_maker
from app.routes import router as routes_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    engine, session_maker = create_async_engine_and_session_maker(
        settings.database_url
    )
    app.state.engine = engine
    app.state.session_maker = session_maker
    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(title="Broker API", lifespan=lifespan)

app.include_router(routes_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Broker API"}
