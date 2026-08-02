from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.security.deps import CurrentUserDep
from app.lib.security.tokens import create_access_token
from app.schemas.auth import (
    MessageResponse,
    ResendVerificationRequest,
    TokenResponse,
    UserLogin,
    UserPublic,
    UserRegister,
    VerifyEmailRequest,
)
from app.schemas.organization import OrganizationPublic
from app.services.auth import (
    authenticate_user,
    list_user_organizations,
    register_user,
    resend_verification_email,
    verify_email,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserPublic, status_code=201)
async def register(
    body: UserRegister,
    session: SessionDep,
) -> UserPublic:
    user = await register_user(session, body)
    return UserPublic.model_validate(user)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email_endpoint(
    body: VerifyEmailRequest,
    session: SessionDep,
) -> MessageResponse:
    await verify_email(session, body.token)
    return MessageResponse(message="Email verified successfully")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    body: ResendVerificationRequest,
    session: SessionDep,
) -> MessageResponse:
    message = await resend_verification_email(
        session,
        body.email,
        body.client_app,
    )
    return MessageResponse(message=message)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: UserLogin,
    session: SessionDep,
) -> TokenResponse:
    user = await authenticate_user(session, body)
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserPublic)
async def me(user: CurrentUserDep) -> UserPublic:
    return UserPublic.model_validate(user)


@router.get("/my-organizations", response_model=list[OrganizationPublic])
async def my_organizations(
    user: CurrentUserDep,
    session: SessionDep,
) -> list[OrganizationPublic]:
    organizations = await list_user_organizations(session, user.id)
    return [OrganizationPublic.model_validate(org) for org in organizations]
