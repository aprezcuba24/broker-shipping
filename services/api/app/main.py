from fastapi import FastAPI

from app.routes import router as routes_router

app = FastAPI(title="Broker API")

app.include_router(routes_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Broker API"}
