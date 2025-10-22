import os
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def test_dynamic_list_available():
    r = requests.get(f"{BASE_URL}/api/dynamic/questionnaires", timeout=10)
    # Dynamic endpoints are always enabled now → must be 200
    assert r.status_code == 200, r.text
    data = r.json()
    # Response is an object with 'items' list
    assert isinstance(data, dict)
    assert isinstance(data.get("items"), list)
    # Each item has minimal shape
    for it in data["items"]:
        assert set(["code", "title"]) <= set(it.keys())

def test_dynamic_overview_exists():
    r = requests.get(f"{BASE_URL}/api/dynamic/overview", timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body, dict)
    # overview should contain 'primary' and 'items'
    assert "primary" in body and "items" in body
    assert isinstance(body["items"], list)
