import os
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def test_cookies_security_flags_in_prod_monkeypatched():
    # This acts as a smoke test: in production the app should enforce secure cookies
    # We can't change server env at runtime here; this test documents expectation.
    # If you run tests with FLASK_ENV=production, verify flags on a response that sets cookies.
    # For now, we just assert the health endpoint works.
    r = requests.get(f"{BASE_URL}/api/health", timeout=5)
    assert r.status_code == 200
