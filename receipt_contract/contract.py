"""Strict, provider-neutral wire model and bounded HMAC service authentication."""

import hashlib
import hmac
import json
import re
from dataclasses import dataclass, field
from uuid import UUID


class ContractError(Exception):
    def __init__(self, code, status=409):
        super().__init__(code)
        self.code, self.status = code, status


def packed(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


@dataclass(frozen=True, repr=False)
class Envelope:
    organization: str
    channel: str
    provider: str
    event_reference: str
    message_reference: str | None
    identity_reference: str
    event_timestamp: int
    event_type: str
    message_type: str | None
    text: str | None

    @classmethod
    def parse(cls, data):
        if not isinstance(data, dict) or set(data) != set(cls.__dataclass_fields__):
            raise ContractError("invalid_contract", 400)
        try:
            UUID(data["organization"])
            for name in ("channel", "provider", "event_reference"):
                if not isinstance(data[name], str) or not re.fullmatch(
                    r"[A-Za-z0-9_.:-]{1,200}", data[name]
                ):
                    raise ValueError
            if not isinstance(data["identity_reference"], str) or not re.fullmatch(
                r"[a-f0-9]{64}", data["identity_reference"]
            ):
                raise ValueError
            if type(data["event_timestamp"]) is not int or data["event_timestamp"] < 0:
                raise ValueError
            if data["event_type"] not in {"message", "unfollow"}:
                raise ValueError
            if data["event_type"] == "message":
                if data["message_type"] != "text":
                    raise ValueError
                if not isinstance(data["message_reference"], str) or not re.fullmatch(
                    r"[A-Za-z0-9_.:-]{1,200}", data["message_reference"]
                ):
                    raise ValueError
                if (
                    not isinstance(data["text"], str)
                    or not 1 <= len(data["text"]) <= 2000
                ):
                    raise ValueError
                if not data["text"].strip() or "\0" in data["text"]:
                    raise ValueError
            elif any(
                data[n] is not None
                for n in ("message_reference", "message_type", "text")
            ):
                raise ValueError
        except (ValueError, TypeError, AttributeError):
            raise ContractError("invalid_contract", 400) from None
        return cls(**data)

    def as_dict(self):
        return {name: getattr(self, name) for name in self.__dataclass_fields__}

    def fingerprint(self, message=False):
        body = self.as_dict()
        if message:
            body.pop("event_reference")
            body.pop("event_timestamp")
        return hashlib.sha256(packed(body).encode()).hexdigest()


@dataclass(frozen=True)
class Credential:
    key: bytes = field(repr=False)
    organization: str
    channel: str
    provider: str


def sign(key, kid, timestamp, nonce, raw):
    digest = hashlib.sha256(raw).hexdigest()
    data = (
        f"POST\n/internal/channel-events/admit\n{kid}\n{timestamp}\n{nonce}\n{digest}"
    )
    return hmac.new(key, data.encode(), hashlib.sha256).hexdigest()


class Authenticator:
    def __init__(self, keys, clock):
        if not keys or any(len(c.key) < 32 for c in keys.values()):
            raise ValueError("invalid_auth_configuration")
        self.keys, self.clock = dict(keys), clock

    def verify(self, headers, raw):
        try:
            kid, nonce = headers["x-key-id"], headers["x-nonce"]
            stamp = headers["x-timestamp"]
            credential = self.keys[kid]
            if len(raw) > 32768 or abs(self.clock() - int(stamp)) > 60:
                raise ValueError
            if not re.fullmatch(r"[a-zA-Z0-9_-]{16,100}", nonce):
                raise ValueError
            expected = sign(credential.key, kid, stamp, nonce, raw)
            if not hmac.compare_digest(expected, headers["x-signature"]):
                raise ValueError
        except (KeyError, ValueError, TypeError):
            raise ContractError("service_auth_failed", 401) from None
        return credential, kid, nonce, hashlib.sha256(raw).hexdigest()
