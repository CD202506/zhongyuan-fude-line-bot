"""Existing Google runtime credential; dedicated Secret Manager resources only."""

import base64
import json
import os

import httpx

PROJECT = "zhongyuan-fude-v2"
SECRETS = frozenset(
    {
        "zyf-line-capture-control",
        "zyf-line-capture-external-01",
        "zyf-line-capture-synthetic",
    }
)


class SecretStore:
    def _request(self, secret, suffix, payload=None):
        if secret not in SECRETS:
            raise RuntimeError("capture_store_scope")
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request

        try:
            info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
            credentials = service_account.Credentials.from_service_account_info(
                info, scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )

            class BoundedRequest(Request):
                def __call__(self, *args, **kwargs):
                    kwargs["timeout"] = 3
                    return super().__call__(*args, **kwargs)

            credentials.refresh(BoundedRequest())
            url = f"https://secretmanager.googleapis.com/v1/projects/{PROJECT}/secrets/{secret}{suffix}"
            with httpx.Client(
                timeout=3, follow_redirects=False, trust_env=False
            ) as client:
                response = client.request(
                    "POST" if payload is not None else "GET",
                    url,
                    headers={"Authorization": "Bearer " + credentials.token},
                    json=payload,
                )
            if response.status_code != 200:
                raise RuntimeError("capture_store_unavailable")
            return response.json()
        except Exception:
            raise RuntimeError("capture_store_unavailable") from None

    def put(self, secret, payload):
        if secret == "zyf-line-capture-control":
            raise RuntimeError("capture_control_read_only")
        encoded = base64.b64encode(
            json.dumps(payload, sort_keys=True).encode()
        ).decode()
        self._request(secret, ":addVersion", {"payload": {"data": encoded}})

    def get(self, secret):
        value = self._request(secret, "/versions/latest:access")
        return json.loads(base64.b64decode(value["payload"]["data"]))
