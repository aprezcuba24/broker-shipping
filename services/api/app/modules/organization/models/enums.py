from enum import StrEnum


class OrgMemberRole(StrEnum):
    provider = "provider"
    seller = "seller"


class InvitationKind(StrEnum):
    provider_invite = "provider_invite"
    seller_request = "seller_request"


class InvitationStatus(StrEnum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
