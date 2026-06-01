'use client';

import { useEffect, useState, useCallback } from 'react';
import { WebSocketManager } from '../utils/websocket';

export interface TelemetryData {
  id: string;
  driver_id: string;
  timestamp: string;
  eye_closure_percentage: number;
  blink_rate: number;
  drowsiness_confidence: number;
  drowsiness_level: 'alert' | 'mild' | 'moderate' | 'severe';
  vehicle_speed_kmh: number;
  gps_latitude: number;
  gps_longitude: number;
  yawn_detected: boolean;
}

export function useTelemetry(driverId: string | null, token: string | null) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsManager] = useState(() => new WebSocketManager(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'
  ));

  useEffect(() => {
    if (!driverId || !token) return;

    const connectWebSocket = async () => {
      try {
        await wsManager.connect(token);
        setIsConnected(true);
        setError(null);

        // Subscribe to telemetry updates for this driver
        wsManager.send('subscribe', { driver_id: driverId, event_type: 'telemetry' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setIsConnected(false);
      }
    };

    const handleTelemetryUpdate = (data: any) => {
      if (data.driver_id === driverId) {
        setTelemetry(data);
      }
    };

    connectWebSocket();
    wsManager.on('telemetry_update', handleTelemetryUpdate);

    return () => {
      wsManager.off('telemetry_update', handleTelemetryUpdate);
      wsManager.disconnect();
    };
  }, [driverId, token, wsManager]);

  return { telemetry, isConnected, error };
}
