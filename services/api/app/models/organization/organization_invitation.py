from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum, ForeignKey
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.organization.enums import InvitationKind, InvitationStatus


class OrganizationInvitation(EntityModel, table=True):
    __tablename__ = "organization_invitation"

    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    counterparty_organization_id: UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    kind: InvitationKind = Field(
        sa_column=Column(
            SAEnum(
                InvitationKind,
                values_callable=lambda x: [e.value for e in x],
                name="invitationkind",
            ),
            nullable=False,
        ),
    )
    status: InvitationStatus = Field(
        default=InvitationStatus.pending,
        sa_column=Column(
            SAEnum(
                InvitationStatus,
                values_callable=lambda x: [e.value for e in x],
                name="invitationstatus",
            ),
            nullable=False,
        ),
    )
    token: str | None = Field(default=None, max_length=64, unique=True, index=True)
    invitee_email: str | None = Field(default=None, max_length=255)
    user_id: UUID | None = Field(default=None, foreign_key="user.id")
    created_by_user_id: UUID = Field(foreign_key="user.id")
