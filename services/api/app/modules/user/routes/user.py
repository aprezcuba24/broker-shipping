from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, HTTPException, Request

from app.lib.security import require_user
from app.lib.security.passwords import hash_password
from app.modules.user.models import TokenResponse, User, UserLogin, UserPublic, UserSignup
from app.modules.user.services import UserService

router = APIRouter(route_class=DishkaRoute)


@router.post("/", response_model=UserPublic, status_code=201)
async def signup(body: UserSignup, service: FromDishka[UserService]):
    entity = User(username=body.username, password_hash=hash_password(body.password))
    created = await service.create(entity)
    return UserPublic.model_validate(created)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    body: UserLogin,
    service: FromDishka[UserService],
):
    user = await service.authenticate(body.username, body.password, request)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = service.issue_access_token(user)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublic)
@require_user
async def me(user: User):
    return UserPublic.model_validate(user)
