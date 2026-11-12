import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_multi_tenant_isolation_and_idor_prevention(client: AsyncClient):
    # 1. Register User Alice
    alice_resp = await client.post("/api/v1/auth/register", json={
        "email": "alice@company-a.com",
        "password": "PasswordAlice123!",
        "full_name": "Alice Tenant",
        "workspace_name": "Company A Workspace"
    })
    assert alice_resp.status_code == 201
    alice_data = alice_resp.json()
    alice_token = alice_data["access_token"]
    ws_a_id = alice_data["active_workspace"]["id"]

    # Alice creates a confidential repository/project in Workspace A
    proj_a_resp = await client.post(
        f"/api/v1/workspaces/{ws_a_id}/projects",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "name": "Secret-Core-Engine",
            "description": "Proprietary internal algorithms",
            "repository": {
                "clone_url": "https://github.com/company-a/secret-core.git",
                "default_branch": "main",
                "is_private": True
            }
        }
    )
    assert proj_a_resp.status_code == 201
    proj_a_id = proj_a_resp.json()["id"]

    # 2. Register User Bob (completely independent tenant)
    bob_resp = await client.post("/api/v1/auth/register", json={
        "email": "bob@competitor-b.com",
        "password": "PasswordBob123!",
        "full_name": "Bob Competitor",
        "workspace_name": "Competitor B Workspace"
    })
    assert bob_resp.status_code == 201
    bob_data = bob_resp.json()
    bob_token = bob_data["access_token"]
    ws_b_id = bob_data["active_workspace"]["id"]

    # 3. IDOR Attack 1: Bob tries to list projects in Alice's Workspace A
    bob_list_a = await client.get(
        f"/api/v1/workspaces/{ws_a_id}/projects",
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    # Must be rejected (404/403)
    assert bob_list_a.status_code in (403, 404), "Tenant Bob accessed Workspace A projects!"

    # 4. IDOR Attack 2: Bob knows the exact UUID of Alice's Project A and tries to access it
    bob_get_proj_a = await client.get(
        f"/api/v1/workspaces/{ws_a_id}/projects/{proj_a_id}",
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert bob_get_proj_a.status_code in (403, 404), "Tenant Bob accessed Project A details!"

    # 5. IDOR Attack 3: Bob tries to spoof the URL by putting his own workspace ID with Alice's project ID
    bob_cross_query = await client.get(
        f"/api/v1/workspaces/{ws_b_id}/projects/{proj_a_id}",
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert bob_cross_query.status_code == 404, "Project A was leaked under Workspace B!"

    # 6. IDOR Attack 4: Bob tries to inject a project into Alice's Workspace A
    bob_inject_proj = await client.post(
        f"/api/v1/workspaces/{ws_a_id}/projects",
        headers={"Authorization": f"Bearer {bob_token}"},
        json={"name": "Trojan Project"}
    )
    assert bob_inject_proj.status_code in (403, 404), "Tenant Bob was able to create resources in Workspace A!"

    # 7. Verification: Alice can still access her project normally
    alice_check = await client.get(
        f"/api/v1/workspaces/{ws_a_id}/projects/{proj_a_id}",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert alice_check.status_code == 200
    assert alice_check.json()["name"] == "Secret-Core-Engine"
