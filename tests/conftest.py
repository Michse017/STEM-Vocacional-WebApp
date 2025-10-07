import os
import threading
import time
import requests
from subprocess import Popen

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:5000")


def wait_for_health(base_url: str, timeout: float = 20.0):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{base_url}/api/health", timeout=2)
            if r.status_code == 200:
                return True
        except Exception:
            time.sleep(0.4)
    return False
