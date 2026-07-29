from typing import Annotated

from pydantic import AfterValidator, EmailStr

from app.lib.normalize import normalize_email, strip_optional, strip_required

NormalizedEmail = Annotated[EmailStr, AfterValidator(lambda v: normalize_email(str(v)))]
NonEmptyStr = Annotated[str, AfterValidator(strip_required)]
OptionalStrippedStr = Annotated[str | None, AfterValidator(strip_optional)]
