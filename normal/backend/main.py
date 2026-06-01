"""
VigilDrive FastAPI Backend
UPGRADED: WebSocket /ws/camera receives frames from OpenCV main.py
          WebSocket /ws/dashboard broadcasts to all browser clients
          MJPEG /video_feed endpoint for direct <img> streaming
          Real alert storage with SQLite
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import json
import asyncio
import sqlite3
import base64
import secrets
import hashlib
import time as _time

from dotenv import load_dotenv
import jwt

load_dotenv()

# ─────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────

SECRET_KEY                  = os.getenv("SECRET_KEY", "vigildrive-secret-change-me")
ALGORITHM                   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 h
DB_PATH                     = os.getenv("DB_PATH", "../vigildrive-ai/analytics/vigildrive.db")

# ─────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="VigilDrive API",
    description="AI-powered real-time driver monitoring system",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# In-Memory State (shared between WebSocket handlers)
# ─────────────────────────────────────────────────────────────

# Latest frame + telemetry from the Python AI process
_latest_frame_jpg: Optional[bytes] = None        # raw JPEG bytes
_latest_telemetry: Dict[str, Any]  = {}          # full telemetry dict

# Connected browser dashboard clients
_dashboard_clients: List[WebSocket] = []

# Auth
_users_db: Dict[str, Dict[str, Any]] = {}
_alerts_mem: List[Dict[str, Any]]    = []

# ─────────────────────────────────────────────────────────────
# Database helpers
# ─────────────────────────────────────────────────────────────

def _db():
    """Open the vigildrive.db SQLite database (read-only is fine for most ops)."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    conn = _db()
    cur  = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time TEXT, end_time TEXT, duration INTEGER,
            total_blinks INTEGER, total_yawns INTEGER,
            total_distractions INTEGER, total_drowsy_events INTEGER,
            average_attention REAL, average_fatigue REAL, risk_level TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT, event_type TEXT, fatigue_score REAL,
            attention_state TEXT, gaze_direction TEXT,
            driver_status TEXT, screenshot_path TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT, attention_score REAL, fatigue_score REAL,
            blink_count INTEGER, yawn_count INTEGER,
            distraction_count INTEGER, risk_level TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id TEXT, alert_type TEXT, severity TEXT,
            message TEXT, timestamp TEXT, location TEXT,
            acknowledged INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()


_init_db()


# ─────────────────────────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────────────────────────

def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def _make_token(data: dict) -> str:
    payload = {**data, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ─────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    organization: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class TelemetryData(BaseModel):
    driver_id: str
    drowsiness_score: float
    eye_closure_duration: float
    head_position: Dict[str, float]
    timestamp: str
    alert_triggered: bool
    location: Optional[Dict[str, float]] = None
    vehicle_speed: Optional[float] = None


class AlertCreate(BaseModel):
    driver_id: str
    alert_type: str
    severity: str
    message: str
    timestamp: str
    location: Optional[Dict[str, float]] = None


# ─────────────────────────────────────────────────────────────
# Auth Endpoints
# ─────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
async def register(data: UserRegister):
    if data.email in _users_db:
        raise HTTPException(400, "Email already registered")
    uid = secrets.token_hex(8)
    _users_db[data.email] = {
        "id": uid, "email": data.email, "name": data.name,
        "organization": data.organization,
        "password": _hash(data.password),
        "created_at": datetime.utcnow().isoformat(),
    }
    token = _make_token({"sub": uid, "email": data.email})
    u = _users_db[data.email]
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": u["id"], "email": u["email"], "name": u["name"]}}


@app.post("/api/auth/login")
async def login(data: UserLogin):
    u = _users_db.get(data.email)
    if not u or u["password"] != _hash(data.password):
        raise HTTPException(401, "Invalid credentials")
    token = _make_token({"sub": u["id"], "email": data.email})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": u["id"], "email": u["email"], "name": u["name"]}}


# ─────────────────────────────────────────────────────────────
# Telemetry REST Endpoint
# ─────────────────────────────────────────────────────────────

@app.post("/api/telemetry")
async def receive_telemetry(data: TelemetryData):
    global _latest_telemetry
    entry = data.model_dump()
    entry["received_at"] = datetime.utcnow().isoformat()
    _latest_telemetry = entry

    if data.alert_triggered:
        severity = "critical" if data.drowsiness_score > 0.8 else "high"
        alert = {
            "id": secrets.token_hex(6),
            "driver_id": data.driver_id,
            "alert_type": "drowsiness",
            "severity": severity,
            "message": f"Drowsiness detected — score {data.drowsiness_score:.2f}",
            "timestamp": data.timestamp,
            "location": data.location,
            "acknowledged": False,
        }
        _alerts_mem.append(alert)
        _save_alert_to_db(alert)
        await _broadcast_to_dashboards({"type": "alert", "data": alert})

    return {"status": "ok", "id": entry.get("driver_id")}


def _save_alert_to_db(alert: dict):
    try:
        conn = _db()
        conn.execute(
            """INSERT INTO alerts (driver_id,alert_type,severity,message,timestamp,location)
               VALUES (?,?,?,?,?,?)""",
            (alert["driver_id"], alert["alert_type"], alert["severity"],
             alert["message"], alert["timestamp"],
             json.dumps(alert.get("location") or {})),
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB] alert save failed: {e}")


# ─────────────────────────────────────────────────────────────
# Alerts & Sessions REST Endpoints
# ─────────────────────────────────────────────────────────────

@app.get("/api/alerts")
async def get_alerts(driver_id: Optional[str] = None, limit: int = 50):
    try:
        conn = _db()
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        result = [dict(r) for r in rows]
        if driver_id:
            result = [r for r in result if r.get("driver_id") == driver_id]
        return result
    except Exception:
        return _alerts_mem[-limit:]


@app.post("/api/alerts")
async def create_alert(alert: AlertCreate):
    entry = {**alert.model_dump(), "id": secrets.token_hex(6), "acknowledged": False}
    _alerts_mem.append(entry)
    _save_alert_to_db(entry)
    await _broadcast_to_dashboards({"type": "alert", "data": entry})
    return entry


@app.patch("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    try:
        conn = _db()
        conn.execute("UPDATE alerts SET acknowledged=1 WHERE id=?", (alert_id,))
        conn.commit()
        conn.close()
    except Exception:
        pass
    for a in _alerts_mem:
        if a.get("id") == alert_id:
            a["acknowledged"] = True
    return {"status": "acknowledged"}


@app.get("/api/sessions")
async def get_sessions(limit: int = 20):
    try:
        conn = _db()
        rows = conn.execute(
            "SELECT * FROM sessions ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


@app.get("/api/events")
async def get_events(limit: int = 50):
    try:
        conn = _db()
        rows = conn.execute(
            "SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


@app.get("/api/analytics")
async def get_analytics(limit: int = 100):
    try:
        conn = _db()
        rows = conn.execute(
            "SELECT * FROM analytics ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


@app.get("/api/stats")
async def get_stats():
    alerts_today = len([a for a in _alerts_mem
                        if a.get("timestamp", "").startswith(datetime.utcnow().date().isoformat())])
    return {
        "activeDrivers":   1 if _latest_telemetry else 0,
        "alertsToday":     alerts_today,
        "avgDrowsiness":   round(_latest_telemetry.get("drowsiness_score", 0) * 100, 1),
        "vehiclesOnline":  1 if _latest_telemetry else 0,
        "lastTelemetry":   _latest_telemetry,
    }


@app.get("/api/monitoring")
async def get_monitoring():
    if not _latest_telemetry:
        return {"monitors": []}
    tele = _latest_telemetry
    return {"monitors": [{
        "id":               "mon_001",
        "driver_name":      f"Driver {tele.get('driver_id','unknown')}",
        "vehicle_id":       "VH-001",
        "drowsiness_level": round(tele.get("drowsiness_score", 0) * 100),
        "eye_closure":      round(tele.get("eye_closure_duration", 0) * 100),
        "speed":            round(tele.get("vehicle_speed") or 0),
        "duration":         0,
        "status":           "online",
    }]}


# ─────────────────────────────────────────────────────────────
# MJPEG Video Feed  →  browser can use <img src="/video_feed">
# ─────────────────────────────────────────────────────────────

async def _mjpeg_generator():
    while True:
        frame = _latest_frame_jpg
        if frame:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" +
                frame +
                b"\r\n"
            )
        await asyncio.sleep(1 / 20)  # 20 fps max


@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(
        _mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ─────────────────────────────────────────────────────────────
# WebSocket: /ws/camera  — receives frames FROM vigildrive-ai main.py
# ─────────────────────────────────────────────────────────────

@app.websocket("/ws/camera")
async def ws_camera(ws: WebSocket):
    """
    vigildrive-ai/main.py connects here and sends JSON messages:
    { "type": "frame", "frame": "<base64 JPEG>", "fatigue_score": ..., ... }
    """
    global _latest_frame_jpg, _latest_telemetry

    await ws.accept()
    print("[WS/camera] AI process connected")

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "frame":
                # Decode frame
                b64 = msg.get("frame", "")
                if b64:
                    _latest_frame_jpg = base64.b64decode(b64)

                # Store telemetry (strip the large frame field)
                tele = {k: v for k, v in msg.items() if k != "frame"}
                _latest_telemetry = tele

                # Broadcast telemetry (NO frame bytes) to browser dashboards
                await _broadcast_to_dashboards({
                    "type":      "telemetry_update",
                    "data":      tele,
                    "timestamp": datetime.utcnow().isoformat(),
                })

    except WebSocketDisconnect:
        print("[WS/camera] AI process disconnected")
    except Exception as e:
        print(f"[WS/camera] Error: {e}")


# ─────────────────────────────────────────────────────────────
# WebSocket: /ws/dashboard  — browser clients connect here
# ─────────────────────────────────────────────────────────────

@app.websocket("/ws/dashboard")
async def ws_dashboard(ws: WebSocket):
    """
    Browser dashboard connects here to receive live telemetry + alerts.
    """
    await ws.accept()
    _dashboard_clients.append(ws)
    print(f"[WS/dashboard] Browser client connected ({len(_dashboard_clients)} total)")

    try:
        # Send current state immediately on connect
        if _latest_telemetry:
            await ws.send_json({
                "type":      "telemetry_update",
                "data":      _latest_telemetry,
                "timestamp": datetime.utcnow().isoformat(),
            })

        while True:
            # Keep-alive: expect "ping", reply "pong"
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=30)
                if data == "ping":
                    await ws.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                await ws.send_json({"type": "ping"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS/dashboard] Error: {e}")
    finally:
        if ws in _dashboard_clients:
            _dashboard_clients.remove(ws)
        print(f"[WS/dashboard] Client disconnected ({len(_dashboard_clients)} remaining)")


# Legacy /ws endpoint kept for compatibility
@app.websocket("/ws")
async def ws_legacy(ws: WebSocket):
    await ws.accept()
    _dashboard_clients.append(ws)
    try:
        while True:
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        if ws in _dashboard_clients:
            _dashboard_clients.remove(ws)


async def _broadcast_to_dashboards(message: dict):
    dead = []
    for client in _dashboard_clients:
        try:
            await client.send_json(message)
        except Exception:
            dead.append(client)
    for d in dead:
        if d in _dashboard_clients:
            _dashboard_clients.remove(d)


# ─────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status":           "healthy",
        "timestamp":        datetime.utcnow().isoformat(),
        "camera_connected": _latest_frame_jpg is not None,
        "dashboard_clients": len(_dashboard_clients),
        "last_telemetry":   bool(_latest_telemetry),
    }


@app.get("/")
async def root():
    return {
        "name":    "VigilDrive API v2",
        "docs":    "/docs",
        "health":  "/api/health",
        "video":   "/video_feed",
        "ws_cam":  "ws://localhost:8000/ws/camera",
        "ws_dash": "ws://localhost:8000/ws/dashboard",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)