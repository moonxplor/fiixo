import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_workspace_creation_and_member_management(client: AsyncClient):
    # 1. Register Owner
    owner_resp = await client.post("/api/v1/auth/register", json={
        "email": "owner@fiixo.io",
        "password": "Password123!",
        "full_name": "Workspace Owner"
    })
    assert owner_resp.status_code == 201
    owner_data = owner_resp.json()
    owner_token = owner_data["access_token"]
    ws_id = owner_data["active_workspace"]["id"]

    # 2. Register a second user to invite
    member_resp = await client.post("/api/v1/auth/register", json={
        "email": "teammate@fiixo.io",
        "password": "Password123!",
        "full_name": "Teammate"
    })
    assert member_resp.status_code == 201
    member_data = member_resp.json()
    member_token = member_data["access_token"]
    member_id = member_data["user"]["id"]

    # 3. Owner adds teammate as MEMBER
    add_resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"email": "teammate@fiixo.io", "role": "member"}
    )
    assert add_resp.status_code == 201
    assert add_resp.json()["email"] == "teammate@fiixo.io"
    assert add_resp.json()["role"] == "member"

    # 4. Teammate lists workspaces -> should include ws_id with role 'member'
    ws_list_resp = await client.get(
        "/api/v1/workspaces",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert ws_list_resp.status_code == 200
    workspaces = ws_list_resp.json()
    matched = [w for w in workspaces if w["id"] == ws_id]
    assert len(matched) == 1
    assert matched[0]["role"] == "member"

    # 5. Member tries to add another member (requires Admin/Owner) -> 403 Forbidden
    forbidden_add = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        headers={"Authorization": f"Bearer {member_token}"},
        json={"email": "hacker@fiixo.io", "role": "member"}
    )
    assert forbidden_add.status_code == 403

    # 6. Owner removes teammate
    del_resp = await client.delete(
        f"/api/v1/workspaces/{ws_id}/members/{member_id}",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert del_resp.status_code == 204

    # 7. Teammate no longer has access to workspace
    access_revoked = await client.get(
        f"/api/v1/workspaces/{ws_id}",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert access_revoked.status_code == 404
