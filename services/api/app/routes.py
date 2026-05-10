from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health(request: Request) -> dict[str, str]:
    try:
        pong = await request.app.state.redis.ping()
    except Exception:
        pong = False
    return {
        "status": "ok" if pong else "degraded",
        "redis": "ok" if pong else "unreachable",
    }


@router.get("/")
async def root() -> dict[str, str]:
    return {"service": "broker-api", "docs": "/docs"}
