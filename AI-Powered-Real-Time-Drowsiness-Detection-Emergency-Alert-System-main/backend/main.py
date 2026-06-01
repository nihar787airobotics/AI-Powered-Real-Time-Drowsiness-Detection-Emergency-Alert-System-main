"""
VigilDrive FastAPI Backend
Real-time driver monitoring and drowsiness detection system
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
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
    severity: str  # "low", "medium", "high", "critical"
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

# ============= Auth Utilities =============

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
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

def get_current_user(token: str = Depends(lambda: None)):
    """Get current user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
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
        "created_at": datetime.utcnow()
    }
    
    users_db[user_data.email] = user
    
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
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
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )

# ============= Telemetry Endpoints =============

@app.post("/api/telemetry")
async def receive_telemetry(data: TelemetryData):
    """Receive telemetry data from monitoring system"""
    telemetry_entry = {
        "id": secrets.token_hex(8),
        **data.model_dump(),
        "received_at": datetime.utcnow()
    }
    telemetry_data.append(telemetry_entry)
    
    # Broadcast to connected clients
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
            "timestamp": data.timestamp,
            "location": data.location,
            "created_at": datetime.utcnow()
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
    cutoff_time = datetime.utcnow() - timedelta(minutes=5)
    return [t for t in telemetry_data if t["timestamp"] > cutoff_time]

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
        **alert.model_dump(),
        "created_at": datetime.utcnow()
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
        "timestamp": datetime.utcnow(),
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
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            # Process heartbeat
            if data == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

async def broadcast_to_clients(message: Dict[str, Any]):
    """Broadcast message to all connected WebSocket clients"""
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_json({
                **message,
                "timestamp": datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Error sending to client: {e}")
            disconnected.append(connection)
    
    # Remove disconnected clients
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)

# ============= WebSocket Endpoint =============

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time telemetry streaming"""
    client_id = secrets.token_urlsafe(16)
    driver_id = None
    
    try:
        await websocket.accept()
        print(f"[v0] WebSocket client {client_id} connected")
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "authenticate":
                driver_id = message.get("driver_id")
                print(f"[v0] Client {client_id} authenticated for driver {driver_id}")
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
                # Receive telemetry from Python backend
                await broadcast_message({
                    "type": "telemetry_update",
                    "driver_id": driver_id,
                    **message
                })
    
    except WebSocketDisconnect:
        print(f"[v0] WebSocket client {client_id} disconnected")
    except Exception as e:
        print(f"[v0] WebSocket error for client {client_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_SERVER_ERROR)
        except:
            pass

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
