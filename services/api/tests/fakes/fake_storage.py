from __future__ import annotations

from app.lib.storage.protocol import PresignedPut


class FakeObjectStorage:
    def __init__(self, *, public_base_url: str = "http://test-cdn.local/bucket") -> None:
        self.public_base_url = public_base_url.rstrip("/")
        self.presigned_puts: list[dict[str, object]] = []
        self.deleted_keys: list[str] = []
        self.ensure_bucket_calls = 0

    async def ensure_bucket(self) -> None:
        self.ensure_bucket_calls += 1

    async def generate_presigned_put(
        self,
        *,
        key: str,
        content_type: str,
        expires_in: int,
    ) -> PresignedPut:
        self.presigned_puts.append(
            {
                "key": key,
                "content_type": content_type,
                "expires_in": expires_in,
            }
        )
        return PresignedPut(
            upload_url=f"https://upload.test/{key}?sig=fake",
            headers={"Content-Type": content_type},
            expires_in=expires_in,
        )

    async def delete_object(self, key: str) -> None:
        self.deleted_keys.append(key)

    def build_public_url(self, key: str | None) -> str | None:
        if not key:
            return None
        return f"{self.public_base_url}/{key.lstrip('/')}"
