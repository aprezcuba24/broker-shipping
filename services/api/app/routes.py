from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter
from redis.asyncio import Redis

router = APIRouter(route_class=DishkaRoute)


@router.get("/health")
async def health(redis: FromDishka[Redis]) -> dict[str, str]:
    try:
        pong = await redis.ping()
    except Exception:
        pong = False
    return {
        "status": "ok" if pong else "degraded",
        "redis": "ok" if pong else "unreachable",
    }


@router.get("/")
async def root() -> dict[str, str]:
    return {"service": "broker-api", "docs": "/docs"}
