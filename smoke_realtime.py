import asyncio
import json
import requests
import websockets

BASE = "http://localhost:8000"
WS_BASE = "ws://localhost:8000"
results = {}

def try_get(path, headers=None, timeout=12):
    try:
        r = requests.get(f"{BASE}{path}", headers=headers, timeout=timeout)
        return r.status_code
    except Exception as e:
        return f"error: {e}"

try:
    r = requests.post(f"{BASE}/login", json={"username": "analyst", "password": "analyst123"}, timeout=12)
    token = r.json().get("access_token") if r.ok else None
    results["login"] = r.status_code
except Exception as e:
    token = None
    results["login"] = f"error: {e}"

headers = {"Authorization": f"Bearer {token}"} if token else {}
results["GET /health"] = try_get("/health", None)
for ep in ["/dashboard", "/datasets", "/threat-intel", "/incidents", "/alerts"]:
    results[f"GET {ep}"] = try_get(ep, headers)

async def ws_check(path):
    try:
        async with websockets.connect(f"{WS_BASE}{path}") as ws:
            await ws.send("ping")
            msg = await asyncio.wait_for(ws.recv(), timeout=10)
            payload = json.loads(msg)
            return {"ok": True, "keys": sorted(list(payload.keys()))[:6]}
    except Exception as e:
        return {"ok": False, "error": str(e)}

async def run_ws():
    for path in ["/ws/alerts", "/ws/incidents", "/ws/dashboard", "/ws/logs"]:
        results[f"WS {path}"] = await ws_check(path)

asyncio.run(run_ws())
print(json.dumps(results, indent=2))
