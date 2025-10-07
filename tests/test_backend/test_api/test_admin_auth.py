import os
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def test_admin_requires_auth():
    # Hitting an admin-only endpoint should return 401/403 without proper auth
    r = requests.get(f"{BASE_URL}/api/admin/questionnaires", timeout=10)
    assert r.status_code in (401, 403)
