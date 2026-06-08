from enum import StrEnum


class OrganizationType(StrEnum):
    provider = "provider"
    seller = "seller"


class InvitationKind(StrEnum):
    member_invite = "member_invite"
    seller_invite = "seller_invite"
    seller_join_request = "seller_join_request"


class InvitationStatus(StrEnum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
