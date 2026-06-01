'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Activity } from 'lucide-react';

export default function MonitoringPage() {
  const [monitors, setMonitors] = useState<any[]>([]);

  useEffect(() => {
    // Fetch active monitoring sessions
    const fetchMonitors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/monitoring', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMonitors(data.monitors || []);
        }
      } catch (error) {
        console.log('[v0] Error fetching monitors:', error);
      }
    };

    fetchMonitors();
    const interval = setInterval(fetchMonitors, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Live Monitoring</h1>
        <p className="text-neutral-400">Real-time driver status and drowsiness detection</p>
      </div>

      {/* Active Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monitors.length > 0 ? (
          monitors.map((monitor) => (
            <div key={monitor.id} className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
              {/* Video Feed */}
              <div className="relative bg-black aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Eye size={48} className="text-neutral-500 mx-auto mb-2" />
                  <p className="text-neutral-500">Camera Feed</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 border-t border-neutral-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{monitor.driver_name}</h3>
                    <p className="text-sm text-neutral-400">{monitor.vehicle_id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    monitor.drowsiness_level < 30 ? 'bg-success/10 text-success' :
                    monitor.drowsiness_level < 60 ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {monitor.drowsiness_level}% Drowsy
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-neutral-700/50 rounded p-2 text-center">
                    <p className="text-neutral-400">Eye Closure</p>
                    <p className="font-bold text-foreground">{monitor.eye_closure}%</p>
                  </div>
                  <div className="bg-neutral-700/50 rounded p-2 text-center">
                    <p className="text-neutral-400">Speed</p>
                    <p className="font-bold text-foreground">{monitor.speed} km/h</p>
                  </div>
                  <div className="bg-neutral-700/50 rounded p-2 text-center">
                    <p className="text-neutral-400">Duration</p>
                    <p className="font-bold text-foreground">{monitor.duration}h</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-2 bg-neutral-800 border border-neutral-700 rounded-xl p-12 text-center">
            <Activity size={48} className="text-neutral-500 mx-auto mb-4" />
            <p className="text-neutral-400">No active monitoring sessions</p>
          </div>
        )}
      </div>

      {/* Alerts Timeline */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Alert Timeline</h2>
        <div className="space-y-3">
          {[
            { time: '2:45 PM', driver: 'John Doe', msg: 'High drowsiness detected', severity: 'danger' },
            { time: '2:30 PM', driver: 'Jane Smith', msg: 'Vehicle drifted (corrected)', severity: 'warning' },
            { time: '2:15 PM', driver: 'Mike Johnson', msg: 'Normal operation', severity: 'success' },
          ].map((alert, idx) => (
            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-neutral-700 last:border-0">
              <div className={`p-2 rounded-lg ${
                alert.severity === 'danger' ? 'bg-danger/10' :
                alert.severity === 'warning' ? 'bg-warning/10' :
                'bg-success/10'
              }`}>
                <AlertTriangle size={16} className={
                  alert.severity === 'danger' ? 'text-danger' :
                  alert.severity === 'warning' ? 'text-warning' :
                  'text-success'
                } />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{alert.driver}</p>
                <p className="text-xs text-neutral-400 mt-1">{alert.msg}</p>
              </div>
              <span className="text-xs text-neutral-500">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
