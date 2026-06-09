import pytest
import uuid

async def get_auth_token(client, email_prefix, password="TestPass@123"):
    email = f"{email_prefix}_{uuid.uuid4()}@example.com"
    await client.post("/auth/register", json={"email": email, "password": password})
    r = await client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]

@pytest.mark.asyncio
async def test_list_patients_requires_auth(client):
    response = await client.get("/patients")
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_and_list_patient(client):
    token = await get_auth_token(client, "admin_patients")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post("/patients", headers=headers, json={
        "full_name": "Budi Santoso",
        "date_of_birth": "1990-05-15",
        "gender": "male",
        "phone": "081234567890",
    })
    assert create_resp.status_code == 201
    patient = create_resp.json()
    assert patient["full_name"] == "Budi Santoso"
    assert patient["patient_code"].startswith("P-")

    list_resp = await client.get("/patients", headers=headers)
    assert list_resp.status_code == 200
    assert any(p["id"] == patient["id"] for p in list_resp.json())

@pytest.mark.asyncio
async def test_get_patient_by_id(client):
    token = await get_auth_token(client, "admin_getpatient")
    headers = {"Authorization": f"Bearer {token}"}
    create = await client.post("/patients", headers=headers, json={
        "full_name": "Siti Rahayu",
        "date_of_birth": "1985-03-20",
        "gender": "female",
    })
    pid = create.json()["id"]
    resp = await client.get(f"/patients/{pid}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Siti Rahayu"

@pytest.mark.asyncio
async def test_update_patient(client):
    token = await get_auth_token(client, "admin_updatepatient")
    headers = {"Authorization": f"Bearer {token}"}
    create = await client.post("/patients", headers=headers, json={
        "full_name": "Ahmad Fauzi",
        "date_of_birth": "2000-01-01",
        "gender": "male",
    })
    pid = create.json()["id"]
    resp = await client.put(f"/patients/{pid}", headers=headers, json={"phone": "089999999"})
    assert resp.status_code == 200
    assert resp.json()["phone"] == "089999999"
