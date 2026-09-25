from enum import StrEnum


class PhoneBlacklistReason(StrEnum):
    nonpayment = "nonpayment"
    fraud = "fraud"
    abuse = "abuse"
    other = "other"
