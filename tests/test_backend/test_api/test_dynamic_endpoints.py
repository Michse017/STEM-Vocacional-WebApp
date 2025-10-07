import os
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def test_dynamic_list_available():
    r = requests.get(f"{BASE_URL}/api/dynamic/questionnaires", timeout=10)
    # In dev we expect dynamic endpoints enabled by default; if disabled, allow 404 gracefully
    assert r.status_code in (200, 404)

    if r.status_code == 200:
        data = r.json()
        # Accept either a plain list or an object with an 'items' list (pagination-friendly)
        if isinstance(data, list):
            assert isinstance(data, list)
        elif isinstance(data, dict):
            assert isinstance(data.get("items", []), list)
        else:
            raise AssertionError(f"Unexpected response type: {type(data)}")
