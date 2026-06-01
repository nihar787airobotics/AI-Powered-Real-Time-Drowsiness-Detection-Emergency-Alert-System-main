'use client';

import { useState, useEffect } from 'react';
import { useTelemetry } from '@/lib/hooks/useTelemetry';

export default function LiveMonitoringPage() {
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const { telemetry, isConnected, error } = useTelemetry(driverId, token);

  useEffect(() => {
    // Get token from localStorage
    const savedToken = localStorage.getItem('token');
    setToken(savedToken);

    // In a real app, get driverId from user profile
    const savedDriverId = localStorage.getItem('driver_id');
    setDriverId(savedDriverId);
  }, []);

  const getDrowsinessColor = (level: string | undefined) => {
    switch (level) {
      case 'severe':
        return 'text-danger';
      case 'moderate':
        return 'text-warning';
      case 'mild':
        return 'text-accent';
      case 'alert':
      default:
        return 'text-success';
    }
  };

  const getDrowsinessBgColor = (level: string | undefined) => {
    switch (level) {
      case 'severe':
        return 'bg-danger/10 border-danger/30';
      case 'moderate':
        return 'bg-warning/10 border-warning/30';
      case 'mild':
        return 'bg-accent/10 border-accent/30';
      case 'alert':
      default:
        return 'bg-success/10 border-success/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Live Monitoring</h1>
        <p className="text-neutral-400">Real-time driver telemetry and safety metrics</p>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${isConnected ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/30'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
          <span className={isConnected ? 'text-success' : 'text-danger'}>
            {isConnected ? 'Connected - Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {telemetry ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Drowsiness Level */}
          <div className={`p-6 rounded-xl border ${getDrowsinessBgColor(telemetry.drowsiness_level)}`}>
            <div className="text-sm font-semibold text-neutral-400 mb-2">Drowsiness Status</div>
            <div className={`text-2xl font-bold capitalize ${getDrowsinessColor(telemetry.drowsiness_level)}`}>
              {telemetry.drowsiness_level}
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              Confidence: {(telemetry.drowsiness_confidence * 100).toFixed(1)}%
            </div>
          </div>

          {/* Eye Closure */}
          <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
            <div className="text-sm font-semibold text-neutral-400 mb-2">Eye Closure</div>
            <div className="text-2xl font-bold text-secondary">
              {telemetry.eye_closure_percentage.toFixed(1)}%
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2 mt-3">
              <div
                className="bg-secondary rounded-full h-2 transition-all"
                style={{ width: `${Math.min(telemetry.eye_closure_percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Blink Rate */}
          <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
            <div className="text-sm font-semibold text-neutral-400 mb-2">Blink Rate</div>
            <div className="text-2xl font-bold text-secondary">
              {telemetry.blink_rate.toFixed(1)} blinks/min
            </div>
            <div className="text-xs text-neutral-500 mt-2">Normal: 15-20 blinks/min</div>
          </div>

          {/* Vehicle Speed */}
          <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
            <div className="text-sm font-semibold text-neutral-400 mb-2">Vehicle Speed</div>
            <div className="text-2xl font-bold text-primary">
              {telemetry.vehicle_speed_kmh.toFixed(1)} km/h
            </div>
          </div>

          {/* Yawn Detection */}
          <div className={`p-6 rounded-xl border ${telemetry.yawn_detected ? 'bg-warning/10 border-warning/30' : 'bg-neutral-800 border-neutral-700'}`}>
            <div className="text-sm font-semibold text-neutral-400 mb-2">Yawn Detected</div>
            <div className={`text-2xl font-bold ${telemetry.yawn_detected ? 'text-warning' : 'text-success'}`}>
              {telemetry.yawn_detected ? '⚠️ Yes' : '✓ No'}
            </div>
          </div>

          {/* Location */}
          <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
            <div className="text-sm font-semibold text-neutral-400 mb-2">Current Location</div>
            <div className="text-xs text-neutral-500 space-y-1 mt-2">
              <div>Lat: {telemetry.gps_latitude.toFixed(6)}</div>
              <div>Lon: {telemetry.gps_longitude.toFixed(6)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-neutral-800 border border-neutral-700 animate-pulse">
              <div className="h-4 bg-neutral-700 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-neutral-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Real-time Alerts */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Active Alerts</h2>
        <div className="space-y-2 text-sm text-neutral-400">
          <p>No active alerts at this time</p>
        </div>
      </div>
    </div>
  );
}
