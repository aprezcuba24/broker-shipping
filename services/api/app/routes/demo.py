from fastapi import APIRouter

router = APIRouter()


@router.get("/hello")
def hello() -> dict[str, str]:
    return {"domain": "demo", "message": "Hola desde demo"}
