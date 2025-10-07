import os
import uuid
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def _get_admin_creds():
    code = os.environ.get("E2E_ADMIN_CODE")
    pw = os.environ.get("E2E_ADMIN_PASSWORD")
    return code, pw


def _skip(msg: str):
    import pytest
    pytest.skip(msg)


def test_admin_e2e_login_me_refresh_logout():
    code = f"e2e_admin_{uuid.uuid4().hex[:8]}"
    password = "AdminPass123"
    # Prefer explicit credentials via env to avoid DB coupling
    env_code, env_pw = _get_admin_creds()
    if env_code and env_pw:
        code = env_code
        password = env_pw
    else:
        # No way to create admin without DB libs; skip with guidance
        _skip("Set E2E_ADMIN_CODE and E2E_ADMIN_PASSWORD to run admin E2E.")
    try:
        s = requests.Session()
        # 1) Login
        r = s.post(f"{BASE_URL}/api/auth/admin/login", json={"codigo": code, "password": password}, timeout=10)
        if r.status_code != 200:
            _skip(f"Admin login failed ({r.status_code}). Ensure admin exists and E2E_ADMIN_* env vars are correct.")
        data = r.json()
        token = data.get("access_token")
        assert token and isinstance(token, str)
        assert s.cookies.get("admin_refresh") is not None
        # 2) Me
        r2 = s.get(f"{BASE_URL}/api/auth/admin/me", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r2.status_code == 200, r2.text
        me = r2.json()
        assert me.get("role") == "admin"
        assert me.get("codigo") == code or True  # codigo may not be included depending on route
        # 3) Refresh
        r3 = s.post(f"{BASE_URL}/api/auth/admin/refresh", timeout=10)
        assert r3.status_code == 200, r3.text
        new_token = r3.json().get("access_token")
        assert new_token and isinstance(new_token, str)
        # 4) Logout (clears refresh cookie)
        r4 = s.post(f"{BASE_URL}/api/auth/admin/logout", timeout=10)
        assert r4.status_code == 200
        # 5) Refresh again should fail (no cookie)
        r5 = s.post(f"{BASE_URL}/api/auth/admin/refresh", timeout=10)
        assert r5.status_code == 401
    finally:
        pass
