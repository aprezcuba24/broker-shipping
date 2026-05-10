from sqlmodel import SQLModel

from app.modules.organization.models.organization import Organization

MODULE_MODELS: tuple[type[SQLModel], ...] = (Organization,)

__all__ = ["MODULE_MODELS", "Organization"]
