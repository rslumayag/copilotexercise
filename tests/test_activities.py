import copy
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as activities_dict

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    # Deep copy original activities and restore after each test to keep isolation
    original = copy.deepcopy(activities_dict)
    yield
    activities_dict.clear()
    activities_dict.update(original)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Basketball Team" in data


def test_signup_and_delete():
    name = "Chess Club"
    email = "testuser@example.com"
    # ensure clean state
    if email in activities_dict[name]["participants"]:
        activities_dict[name]["participants"].remove(email)

    # signup
    resp = client.post(f"/activities/{name}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities_dict[name]["participants"]

    # delete
    resp = client.delete(f"/activities/{name}/participants", params={"email": email})
    assert resp.status_code == 200
    assert email not in activities_dict[name]["participants"]


def test_duplicate_signup():
    name = "Basketball Team"
    email = "dup@example.com"
    # ensure removed
    if email in activities_dict[name]["participants"]:
        activities_dict[name]["participants"].remove(email)

    resp1 = client.post(f"/activities/{name}/signup", params={"email": email})
    assert resp1.status_code == 200

    resp2 = client.post(f"/activities/{name}/signup", params={"email": email})
    assert resp2.status_code == 400
