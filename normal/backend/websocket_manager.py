import asyncio
import json
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        self.driver_subscriptions: Dict[str, Set[str]] = {}
        self.driver_connections: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, client_id: str, driver_id: str):
        await websocket.accept()
        self.active_connections[client_id] = {
            "websocket": websocket,
            "driver_id": driver_id,
            "subscriptions": set()
        }
        
        if driver_id not in self.driver_connections:
            self.driver_connections[driver_id] = set()
        self.driver_connections[driver_id].add(client_id)
        
        logger.info(f"Client {client_id} connected for driver {driver_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            driver_id = self.active_connections[client_id]["driver_id"]
            del self.active_connections[client_id]
            
            if driver_id in self.driver_connections:
                self.driver_connections[driver_id].discard(client_id)
                if not self.driver_connections[driver_id]:
                    del self.driver_connections[driver_id]
            
            logger.info(f"Client {client_id} disconnected")

    async def subscribe(self, client_id: str, event_type: str):
        if client_id in self.active_connections:
            self.active_connections[client_id]["subscriptions"].add(event_type)
            logger.info(f"Client {client_id} subscribed to {event_type}")

    async def broadcast_to_driver(self, driver_id: str, message: Dict[str, Any]):
        """Broadcast message to all clients monitoring a specific driver"""
        if driver_id in self.driver_connections:
            for client_id in self.driver_connections[driver_id]:
                if client_id in self.active_connections:
                    try:
                        await self.active_connections[client_id]["websocket"].send_json(message)
                    except Exception as e:
                        logger.error(f"Error sending message to client {client_id}: {e}")

    async def broadcast_alert(self, driver_id: str, alert_data: Dict[str, Any]):
        """Broadcast alert to all connections for a driver"""
        message = {
            "type": "alert",
            "driver_id": driver_id,
            **alert_data
        }
        await self.broadcast_to_driver(driver_id, message)

    async def broadcast_telemetry(self, driver_id: str, telemetry_data: Dict[str, Any]):
        """Broadcast telemetry update to all connections for a driver"""
        message = {
            "type": "telemetry_update",
            "driver_id": driver_id,
            **telemetry_data
        }
        await self.broadcast_to_driver(driver_id, message)


# Global connection manager
connection_manager = ConnectionManager()
