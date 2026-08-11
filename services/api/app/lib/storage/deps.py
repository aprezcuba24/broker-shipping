from __future__ import annotations

from app.config import settings
from app.lib.storage.protocol import ObjectStorage
from app.lib.storage.s3 import S3ObjectStorage

_storage: ObjectStorage | None = None


def get_object_storage() -> ObjectStorage:
    global _storage
    if _storage is None:
        _storage = S3ObjectStorage(settings)
    return _storage


def set_object_storage(storage: ObjectStorage | None) -> None:
    """Override storage (tests) or reset to lazy default when None."""
    global _storage
    _storage = storage
