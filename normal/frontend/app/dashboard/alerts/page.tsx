'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Fetch alerts
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/alerts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.log('[v0] Error fetching alerts:', error);
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(a =>
    filterStatus === 'all' || a.status === filterStatus
  );

  const getAlertIcon = (severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="text-danger" size={20} />;
    if (severity === 'warning') return <Clock className="text-warning" size={20} />;
    return <CheckCircle className="text-success" size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Alerts & Incidents</h1>
        <p className="text-neutral-400">Monitor all drowsiness detection alerts</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['all', 'open', 'acknowledged', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === status
                ? 'bg-primary text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-foreground'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`bg-neutral-800 border rounded-xl p-4 flex items-start gap-4 hover:border-neutral-600 transition ${
                alert.severity === 'critical' ? 'border-danger/30' :
                alert.severity === 'warning' ? 'border-warning/30' :
                'border-neutral-700'
              }`}
            >
              <div className="flex-shrink-0 pt-1">
                {getAlertIcon(alert.severity)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{alert.title}</h3>
                    <p className="text-sm text-neutral-400">{alert.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                    alert.status === 'open' ? 'bg-danger/10 text-danger' :
                    alert.status === 'acknowledged' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  }`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span>Driver: {alert.driver_name}</span>
                  <span>Vehicle: {alert.vehicle_id}</span>
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              <button className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded text-sm transition">
                View
              </button>
            </div>
          ))
        ) : (
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-12 text-center">
            <CheckCircle className="text-success mx-auto mb-4" size={48} />
            <p className="text-neutral-400 text-lg">No alerts in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
