from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class PresignedPut:
    upload_url: str
    headers: dict[str, str]
    expires_in: int


class ObjectStorage(Protocol):
    async def generate_presigned_put(
        self,
        *,
        key: str,
        content_type: str,
        expires_in: int,
    ) -> PresignedPut: ...

    async def delete_object(self, key: str) -> None: ...

    def build_public_url(self, key: str | None) -> str | None: ...
