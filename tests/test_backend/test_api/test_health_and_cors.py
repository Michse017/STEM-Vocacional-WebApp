import os
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def test_health_endpoint_ok():
    r = requests.get(f"{BASE_URL}/api/health", timeout=5)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


def test_cors_headers_present():
    # Simulate browser preflight for a public API route
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type, Authorization"
    }
    r = requests.options(f"{BASE_URL}/api/health", headers=headers, timeout=5)
    assert r.status_code in (200, 204)
    # On dev, CORS should reflect allowed origin
    allow_origin = r.headers.get("Access-Control-Allow-Origin")
    assert allow_origin in ("http://localhost:3000", "http://127.0.0.1:3000")
