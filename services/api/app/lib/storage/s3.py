from __future__ import annotations

from typing import Any

import aioboto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import Settings
from app.lib.storage.protocol import PresignedPut


class S3ObjectStorage:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._session = aioboto3.Session()

    def _client_kwargs(self) -> dict[str, Any]:
        endpoint = self._settings.aws_endpoint_url.strip()
        kwargs: dict[str, Any] = {
            "service_name": "s3",
            "region_name": self._settings.aws_region,
            "aws_access_key_id": self._settings.aws_access_key_id or None,
            "aws_secret_access_key": self._settings.aws_secret_access_key or None,
            "config": Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"} if endpoint else {},
            ),
        }
        if endpoint:
            kwargs["endpoint_url"] = endpoint
        return kwargs

    def _public_base_url(self) -> str:
        configured = self._settings.s3_public_base_url.strip().rstrip("/")
        if configured:
            return configured
        endpoint = self._settings.aws_endpoint_url.strip().rstrip("/")
        bucket = self._settings.s3_bucket
        if endpoint and bucket:
            return f"{endpoint}/{bucket}"
        if bucket:
            region = self._settings.aws_region
            return f"https://{bucket}.s3.{region}.amazonaws.com"
        return ""

    async def generate_presigned_put(
        self,
        *,
        key: str,
        content_type: str,
        expires_in: int,
    ) -> PresignedPut:
        bucket = self._settings.s3_bucket
        async with self._session.client(**self._client_kwargs()) as client:
            upload_url = await client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": bucket,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
        return PresignedPut(
            upload_url=upload_url,
            headers={"Content-Type": content_type},
            expires_in=expires_in,
        )

    async def delete_object(self, key: str) -> None:
        bucket = self._settings.s3_bucket
        if not bucket or not key:
            return
        async with self._session.client(**self._client_kwargs()) as client:
            try:
                await client.delete_object(Bucket=bucket, Key=key)
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in {"404", "NoSuchKey", "NotFound"}:
                    return
                raise

    def build_public_url(self, key: str | None) -> str | None:
        if not key:
            return None
        base = self._public_base_url()
        if not base:
            return None
        return f"{base}/{key.lstrip('/')}"
