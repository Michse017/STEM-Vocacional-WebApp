import requests

# Probar health check
print("Testing health check...")
try:
    response = requests.get("https://stem-backend-9sc0.onrender.com/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\nTesting admin API...")
try:
    response = requests.get("https://stem-backend-9sc0.onrender.com/api/admin/cuestionarios")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")