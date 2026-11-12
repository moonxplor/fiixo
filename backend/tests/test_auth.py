import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient):
    # 1. Register a new user
    reg_payload = {
        "email": "developer@fiixo.io",
        "password": "StrongPassword123!",
        "full_name": "Dev User",
        "workspace_name": "Dev Labs"
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201, reg_resp.text
    data = reg_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "developer@fiixo.io"
    assert data["active_workspace"]["name"] == "Dev Labs"
    assert data["active_workspace"]["role"] == "owner"

    # 2. Reject duplicate email
    dup_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409

    # 3. Authenticate with correct credentials
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "developer@fiixo.io",
        "password": "StrongPassword123!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]

    # 4. Access protected /auth/me endpoint
    me_resp = await client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "developer@fiixo.io"

    # 5. Rotate refresh token
    rotate_resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert rotate_resp.status_code == 200
    new_tokens = rotate_resp.json()
    assert new_tokens["access_token"] != access_token

    # 6. Verify old refresh token is now revoked (single-use rotation)
    stale_resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert stale_resp.status_code == 401

@pytest.mark.asyncio
async def test_unauthenticated_requests_rejected(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    resp_bad_token = await client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer invalid_gibberish_token"
    })
    assert resp_bad_token.status_code == 401
