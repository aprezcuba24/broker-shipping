import boto3

from app.config import settings


def s3_client():
    """S3 client (AWS or MinIO via AWS_ENDPOINT_URL). Wire uploads in Phase 1."""
    kwargs: dict = {}
    if settings.aws_endpoint_url:
        kwargs["endpoint_url"] = settings.aws_endpoint_url
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        **kwargs,
    )
