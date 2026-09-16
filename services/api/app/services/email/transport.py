"""Outbound email: SMTP (MailHog locally) or SES API v2 (HTTPS in production)."""

from __future__ import annotations

import logging
from email.message import EmailMessage
from typing import Any

import aioboto3
import aiosmtplib

from app.config import Settings, settings

logger = logging.getLogger(__name__)

_LOCAL_SMTP_HOSTS = frozenset({"localhost", "127.0.0.1", "mailhog", "::1"})


def _use_local_smtp(cfg: Settings) -> bool:
    host = cfg.smtp_host.strip().lower()
    return host in _LOCAL_SMTP_HOSTS or cfg.smtp_port == 1025


def _use_ses(cfg: Settings) -> bool:
    return bool(cfg.aws_access_key_id.strip()) and not _use_local_smtp(cfg)


async def _send(*, to: str, subject: str, body: str) -> None:
    if _use_ses(settings):
        await _send_ses(to=to, subject=subject, body=body, cfg=settings)
        return
    await _send_smtp(to=to, subject=subject, body=body, cfg=settings)


async def _send_smtp(
    *,
    to: str,
    subject: str,
    body: str,
    cfg: Settings,
) -> None:
    message = EmailMessage()
    message["From"] = cfg.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    kwargs: dict[str, object] = {
        "hostname": cfg.smtp_host,
        "port": cfg.smtp_port,
        "use_tls": cfg.smtp_use_tls,
    }
    if cfg.smtp_user:
        kwargs["username"] = cfg.smtp_user
        kwargs["password"] = cfg.smtp_password

    await aiosmtplib.send(message, **kwargs)
    logger.info("Email sent via smtp to %s subject=%s", to, subject)


def _ses_client_kwargs(cfg: Settings) -> dict[str, Any]:
    """SES always uses the regional AWS endpoint — never MinIO's AWS_ENDPOINT_URL."""
    return {
        "service_name": "sesv2",
        "region_name": cfg.aws_region,
        "aws_access_key_id": cfg.aws_access_key_id or None,
        "aws_secret_access_key": cfg.aws_secret_access_key or None,
    }


async def _send_ses(
    *,
    to: str,
    subject: str,
    body: str,
    cfg: Settings,
) -> None:
    session = aioboto3.Session()
    async with session.client(**_ses_client_kwargs(cfg)) as client:
        await client.send_email(
            FromEmailAddress=cfg.mail_from,
            Destination={"ToAddresses": [to]},
            Content={
                "Simple": {
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": body, "Charset": "UTF-8"},
                    },
                }
            },
        )
    logger.info("Email sent via ses to %s subject=%s", to, subject)
