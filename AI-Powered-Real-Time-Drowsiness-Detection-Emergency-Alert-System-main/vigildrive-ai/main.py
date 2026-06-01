"""
VigilDrive FastAPI Backend
Real-time driver monitoring and drowsiness detection system
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
import os
import json
import asyncio
from dotenv import load_dotenv
import jwt
import hashlib
import secrets

# Load environment variables
load_dotenv()

# Constants
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# FastAPI app setup
app = FastAPI(
    title="VigilDrive API",
    description="AI-powered driver monitoring system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app"]
)

# ============= Pydantic Models =============

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    organization: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    organization: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TelemetryData(BaseModel):
    driver_id: str
    drowsiness_score: float
    eye_closure_duration: float
    head_position: Dict[str, float]
    timestamp: datetime
    alert_triggered: bool
    location: Optional[Dict[str, float]] = None
    vehicle_speed: Optional[float] = None

class AlertData(BaseModel):
    driver_id: str
    alert_type: str  # "drowsiness", "emergency", "speeding"
    severity: str    # "low", "medium", "high", "critical"
    message: str
    timestamp: datetime
    location: Optional[Dict[str, float]] = None

class DriverProfile(BaseModel):
    id: str
    name: str
    email: str
    license_number: str
    phone: str
    vehicle_id: str
    status: str  # "active", "inactive", "on_leave"
    total_hours_driven: float
    total_alerts: int
    last_alert: Optional[datetime] = None

# ============= In-Memory Storage (Replace with DB) =============

users_db: Dict[str, Dict[str, Any]] = {}
tokens_db: Dict[str, str] = {}
telemetry_data: List[Dict[str, Any]] = []
alerts_data: List[Dict[str, Any]] = []
active_connections: List[WebSocket] = []
drivers_data: Dict[str, Dict[str, Any]] = {}

# ============= Helper: JSON-safe datetime serialization =============

def to_json_safe(obj: Any) -> Any:
    """Recursively convert datetime objects to ISO strings for JSON serialization."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_json_safe(i) for i in obj]
    return obj

def utcnow() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)

# ============= Auth Utilities =============

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = utcnow() + expires_delta
    else:
        expire = utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# FIX: Use Authorization header properly instead of broken Depends(lambda: None)
def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    """Get current user from Bearer token in Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    return verify_token(token)

# ============= Authentication Endpoints =============

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    if user_data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = secrets.token_hex(8)
    hashed_password = hash_password(user_data.password)

    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "organization": user_data.organization,
        "password": hashed_password,
        "created_at": utcnow()
    }

    users_db[user_data.email] = user

    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # FIX: Build UserResponse without leaking 'password' field
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            organization=user["organization"],
            created_at=user["created_at"]
        )
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login user"""
    user = users_db.get(user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user["password"] != hash_password(user_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user["id"], "email": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # FIX: Build UserResponse without leaking 'password' field
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            organization=user["organization"],
            created_at=user["created_at"]
        )
    )

# ============= Telemetry Endpoints =============

@app.post("/api/telemetry")
async def receive_telemetry(data: TelemetryData):
    """Receive telemetry data from monitoring system"""
    telemetry_entry = {
        "id": secrets.token_hex(8),
        **to_json_safe(data.model_dump()),  # FIX: convert datetimes before storing
        "received_at": utcnow().isoformat()
    }
    telemetry_data.append(telemetry_entry)

    # Broadcast to connected clients — already JSON-safe
    await broadcast_to_clients({
        "type": "telemetry",
        "data": telemetry_entry
    })

    # If alert triggered, also log alert
    if data.alert_triggered:
        alert_entry = {
            "id": secrets.token_hex(8),
            "driver_id": data.driver_id,
            "alert_type": "drowsiness",
            "severity": "high" if data.drowsiness_score > 0.8 else "medium",
            "message": f"Drowsiness detected - Score: {data.drowsiness_score:.2f}",
            "timestamp": data.timestamp.isoformat(),
            "location": data.location,
            "created_at": utcnow().isoformat()
        }
        alerts_data.append(alert_entry)

        # Broadcast alert
        await broadcast_to_clients({
            "type": "alert",
            "data": alert_entry
        })

    return {"status": "received", "id": telemetry_entry["id"]}

@app.get("/api/telemetry/driver/{driver_id}")
async def get_driver_telemetry(driver_id: str, limit: int = 100):
    """Get recent telemetry for a specific driver"""
    driver_telemetry = [t for t in telemetry_data if t["driver_id"] == driver_id]
    return sorted(driver_telemetry, key=lambda x: x["timestamp"], reverse=True)[:limit]

@app.get("/api/telemetry/live")
async def get_live_telemetry():
    """Get latest telemetry data (last 5 minutes)"""
    # FIX: compare ISO string timestamps correctly after normalization
    cutoff_time = utcnow() - timedelta(minutes=5)
    cutoff_str = cutoff_time.isoformat()
    result = []
    for t in telemetry_data:
        ts = t.get("timestamp", "")
        # Stored as ISO string after fix; compare lexicographically (works for UTC ISO)
        if isinstance(ts, str) and ts >= cutoff_str[:19]:
            result.append(t)
        elif isinstance(ts, datetime):
            # Fallback: handle if datetime slipped through
            ts_aware = ts.replace(tzinfo=timezone.utc) if ts.tzinfo is None else ts
            if ts_aware >= cutoff_time:
                result.append(t)
    return result

# ============= Alerts Endpoints =============

@app.get("/api/alerts")
async def get_alerts(driver_id: Optional[str] = None, limit: int = 50):
    """Get alerts with optional driver filter"""
    filtered_alerts = alerts_data
    if driver_id:
        filtered_alerts = [a for a in filtered_alerts if a["driver_id"] == driver_id]
    return sorted(filtered_alerts, key=lambda x: x["timestamp"], reverse=True)[:limit]

@app.post("/api/alerts")
async def create_alert(alert: AlertData):
    """Create a new alert"""
    alert_entry = {
        "id": secrets.token_hex(8),
        **to_json_safe(alert.model_dump()),  # FIX: convert datetimes
        "created_at": utcnow().isoformat()
    }
    alerts_data.append(alert_entry)

    # Broadcast alert to all connected clients
    await broadcast_to_clients({
        "type": "alert",
        "data": alert_entry
    })

    return alert_entry

# ============= Driver Endpoints =============

@app.get("/api/drivers", response_model=List[DriverProfile])
async def get_drivers():
    """Get all drivers"""
    return list(drivers_data.values())

@app.post("/api/drivers", response_model=DriverProfile)
async def create_driver(driver: DriverProfile):
    """Create a new driver profile"""
    drivers_data[driver.id] = driver.model_dump()
    return driver

@app.get("/api/drivers/{driver_id}", response_model=DriverProfile)
async def get_driver(driver_id: str):
    """Get specific driver details"""
    driver = drivers_data.get(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

# ============= Health Check =============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": utcnow().isoformat(),
        "telemetry_count": len(telemetry_data),
        "alerts_count": len(alerts_data),
        "active_connections": len(active_connections)
    }

# ============= WebSocket for Real-time Updates =============

@app.websocket("/ws/monitoring")
async def websocket_monitoring(websocket: WebSocket):
    """WebSocket endpoint for real-time monitoring"""
    await websocket.accept()
    active_connections.append(websocket)

    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to monitoring server",
            "timestamp": utcnow().isoformat()
        })

        # Keep connection alive
        while True:
            data = await websocket.receive_text()

            if data == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": utcnow().isoformat()
                })
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

async def broadcast_to_clients(message: Dict[str, Any]):
    """Broadcast message to all connected WebSocket clients on /ws/monitoring"""
    disconnected = []
    payload = {
        **to_json_safe(message),  # FIX: ensure no datetime objects sneak in
        "timestamp": utcnow().isoformat()
    }
    for connection in active_connections:
        try:
            await connection.send_json(payload)
        except Exception as e:
            print(f"Error sending to client: {e}")
            disconnected.append(connection)

    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)

# ============= WebSocket Endpoint (/ws) =============

# FIX: Separate connection pool for /ws clients (was sharing state with /ws/monitoring)
ws_connections: Dict[str, Dict[str, Any]] = {}

async def broadcast_message(message: Dict[str, Any]):
    """
    FIX: This function was called in /ws endpoint but was never defined — caused
    NameError at runtime. Now properly broadcasts to all /ws clients.
    """
    payload = to_json_safe(message)
    payload["timestamp"] = utcnow().isoformat()
    disconnected = []
    for client_id, conn_info in ws_connections.items():
        try:
            await conn_info["websocket"].send_json(payload)
        except Exception as e:
            print(f"Error broadcasting to ws client {client_id}: {e}")
            disconnected.append(client_id)
    for client_id in disconnected:
        ws_connections.pop(client_id, None)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time telemetry streaming"""
    client_id = secrets.token_urlsafe(16)
    driver_id = None

    try:
        await websocket.accept()
        ws_connections[client_id] = {"websocket": websocket, "driver_id": None}
        print(f"[ws] Client {client_id} connected")

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "authenticate":
                driver_id = message.get("driver_id")
                ws_connections[client_id]["driver_id"] = driver_id
                print(f"[ws] Client {client_id} authenticated for driver {driver_id}")
                await websocket.send_json({
                    "type": "authenticated",
                    "client_id": client_id,
                    "driver_id": driver_id
                })

            elif message.get("type") == "subscribe":
                await websocket.send_json({
                    "type": "subscription_confirmed",
                    "event_type": message.get("event_type")
                })

            elif message.get("type") == "telemetry":
                # FIX: broadcast_message is now properly defined above
                await broadcast_message({
                    "type": "telemetry_update",
                    "driver_id": driver_id,
                    **message
                })

            elif message.get("type") == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": utcnow().isoformat()
                })

    except WebSocketDisconnect:
        print(f"[ws] Client {client_id} disconnected")
    except Exception as e:
        print(f"[ws] Error for client {client_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
    finally:
        ws_connections.pop(client_id, None)

# ============= Root Endpoint =============

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "VigilDrive API",
        "version": "1.0.0",
        "description": "AI-powered driver monitoring system",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
