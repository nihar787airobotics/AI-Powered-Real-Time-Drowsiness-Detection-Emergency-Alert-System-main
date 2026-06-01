'use client';

import { useState } from 'react';

interface EmergencyRecord {
  id: string;
  timestamp: string;
  trigger_type: 'manual_sos' | 'auto_trigger' | 'system_alert';
  status: 'active' | 'in_progress' | 'resolved';
  severity: string;
  location: string;
  description: string;
  responder?: string;
}

const mockEmergencies: EmergencyRecord[] = [
  {
    id: '1',
    timestamp: '2026-05-28 14:32',
    trigger_type: 'manual_sos',
    status: 'resolved',
    severity: 'high',
    location: 'Highway 101, Exit 42',
    description: 'Driver manually triggered SOS for vehicle breakdown',
    responder: 'Emergency Services Unit 5',
  },
  {
    id: '2',
    timestamp: '2026-05-27 09:15',
    trigger_type: 'auto_trigger',
    status: 'resolved',
    severity: 'medium',
    location: 'Downtown District',
    description: 'Severe drowsiness detected - auto alert triggered',
    responder: 'Fleet Manager - John Smith',
  },
];

export default function SOSPage() {
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState<number | null>(null);

  const handleSOSClick = () => {
    setShowSOSConfirm(true);
    setSOSCountdown(5);
  };

  const handleSOSConfirm = () => {
    console.log('[v0] SOS Activated!');
    // Send SOS signal to backend
    setShowSOSConfirm(false);
    setSOSCountdown(null);
    // Show success message
  };

  const handleSOSCancel = () => {
    setShowSOSConfirm(false);
    setSOSCountdown(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Emergency SOS System</h1>
        <p className="text-neutral-400">Immediate emergency response and incident history</p>
      </div>

      {/* SOS Button - Large and Prominent */}
      <div className="relative">
        {showSOSConfirm ? (
          <div className="bg-danger/20 border-2 border-danger rounded-2xl p-12 text-center space-y-6">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-2xl font-bold text-danger">Are you sure?</h2>
            <p className="text-danger/80 mb-4">
              Activating SOS will immediately alert emergency services and your fleet manager
            </p>

            {sosCountdown !== null && sosCountdown > 0 && (
              <div className="text-5xl font-bold text-danger mb-4">{sosCountdown}</div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSOSConfirm}
                className="px-8 py-4 bg-danger text-white font-bold rounded-lg hover:bg-danger/80 transition text-lg"
              >
                Confirm SOS
              </button>
              <button
                onClick={handleSOSCancel}
                className="px-8 py-4 bg-neutral-700 text-foreground font-bold rounded-lg hover:bg-neutral-600 transition text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSOSClick}
            className="w-full bg-gradient-to-br from-danger to-danger/80 text-white font-bold py-8 px-12 rounded-2xl text-3xl hover:from-danger/90 hover:to-danger/70 transition shadow-lg hover:shadow-danger/50"
          >
            🆘 ACTIVATE SOS
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-neutral-800 border border-neutral-700 rounded-xl hover:border-primary/50 transition text-center">
          <div className="text-2xl mb-2">📞</div>
          <div className="font-semibold text-foreground text-sm">Call Emergency</div>
          <div className="text-xs text-neutral-500">Direct call to 911</div>
        </button>

        <button className="p-4 bg-neutral-800 border border-neutral-700 rounded-xl hover:border-primary/50 transition text-center">
          <div className="text-2xl mb-2">👥</div>
          <div className="font-semibold text-foreground text-sm">Notify Manager</div>
          <div className="text-xs text-neutral-500">Alert your fleet manager</div>
        </button>

        <button className="p-4 bg-neutral-800 border border-neutral-700 rounded-xl hover:border-primary/50 transition text-center">
          <div className="text-2xl mb-2">📍</div>
          <div className="font-semibold text-foreground text-sm">Share Location</div>
          <div className="text-xs text-neutral-500">Send GPS coordinates</div>
        </button>
      </div>

      {/* Active Incidents */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Active Incidents</h2>
        <div className="text-neutral-400 text-sm">No active incidents at this time</div>
      </div>

      {/* Incident History */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Incident History</h2>
        <div className="space-y-3">
          {mockEmergencies.map((incident) => (
            <div key={incident.id} className="border border-neutral-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{incident.description}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        incident.status === 'resolved'
                          ? 'bg-success/20 text-success'
                          : incident.status === 'in_progress'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-danger/20 text-danger'
                      }`}
                    >
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{incident.timestamp}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <span className="text-neutral-500">Location:</span>
                  <div className="text-foreground">{incident.location}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Severity:</span>
                  <div
                    className={`font-semibold ${
                      incident.severity === 'high'
                        ? 'text-danger'
                        : incident.severity === 'medium'
                        ? 'text-warning'
                        : 'text-info'
                    }`}
                  >
                    {incident.severity.toUpperCase()}
                  </div>
                </div>
              </div>

              {incident.responder && (
                <div className="text-sm text-neutral-400 mt-3">
                  <span className="text-neutral-500">Responder:</span> {incident.responder}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Emergency Contacts</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
            <div>
              <div className="font-semibold text-foreground">Emergency Services</div>
              <div className="text-neutral-500">Police, Fire, Ambulance</div>
            </div>
            <div className="font-bold text-danger">911</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
            <div>
              <div className="font-semibold text-foreground">Fleet Manager</div>
              <div className="text-neutral-500">John Smith</div>
            </div>
            <div className="text-primary">+1-555-0123</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
            <div>
              <div className="font-semibold text-foreground">VigilDrive Support</div>
              <div className="text-neutral-500">24/7 Emergency Support</div>
            </div>
            <div className="text-secondary">+1-555-9999</div>
          </div>
        </div>
      </div>
    </div>
  );
}
