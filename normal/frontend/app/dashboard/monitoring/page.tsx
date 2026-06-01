'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, AlertTriangle, Eye, Wifi, WifiOff,
  Camera, CameraOff, Brain, Gauge, Wind, Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Telemetry {
  driver_id?: string;
  fatigue_score?: number;
  driver_status?: string;   // NORMAL | TIRED | DROWSY | DANGER
  attention_state?: string; // ATTENTIVE | DISTRACTED | CRITICAL_DISTRACTION
  gaze_direction?: string;
  ear?: number;
  mar?: number;
  yaw?: number;
  pitch?: number;
  distracted?: boolean;
  yawning?: boolean;
  drowsy?: boolean;
  blinks?: number;
  total_yawns?: number;
  session_duration?: number;
  total_blinks?: number;
  total_distractions?: number;
  average_attention?: number;
  average_fatigue?: number;
  driver_risk?: string;
  calibrated?: boolean;
  fps?: number;
  timestamp?: string;
}

interface AlertItem {
  id: string;
  driver_id: string;
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API   = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:8000';
const WS    = process.env.NEXT_PUBLIC_WS_URL   || 'ws://localhost:8000';

const STATUS_COLORS: Record<string, string> = {
  NORMAL:  'text-green-400',
  TIRED:   'text-amber-400',
  DROWSY:  'text-orange-400',
  DANGER:  'text-red-400',
};
const STATUS_BG: Record<string, string> = {
  NORMAL:  'bg-green-500/10 border-green-500/30',
  TIRED:   'bg-amber-500/10 border-amber-500/30',
  DROWSY:  'bg-orange-500/10 border-orange-500/30',
  DANGER:  'bg-red-500/10 border-red-500/30 animate-pulse',
};
const SEV_COLORS: Record<string, string> = {
  low:      'bg-green-500/10 text-green-400 border border-green-500/30',
  medium:   'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  high:     'bg-orange-500/10 text-orange-400 border border-orange-500/30',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, unit = '', warn = false, icon: Icon,
}: {
  label: string; value: string | number; unit?: string;
  warn?: boolean; icon?: React.ElementType;
}) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? 'bg-red-500/10 border-red-500/30' : 'bg-neutral-800 border-neutral-700'}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={14} className="text-neutral-400" />}
        <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold">{label}</span>
      </div>
      <div className={`text-2xl font-bold font-mono ${warn ? 'text-red-400' : 'text-white'}`}>
        {value}<span className="text-sm font-normal text-neutral-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function Bar({ value, max = 100, color = '#3b82f6' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor =
    pct >= 70 ? '#ef4444' :
    pct >= 45 ? '#f97316' :
    pct >= 25 ? '#f59e0b' : '#22c55e';
  return (
    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color === 'auto' ? barColor : color }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [tele, setTele]           = useState<Telemetry>({});
  const [wsState, setWsState]     = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [alerts, setAlerts]       = useState<AlertItem[]>([]);
  const [history, setHistory]     = useState<{ t: string; fs: number }[]>([]);
  const [imgError, setImgError]   = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  const wsRef      = useRef<WebSocket | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── fetch past alerts from REST on mount ──────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/alerts?limit=20`)
      .then(r => r.ok ? r.json() : [])
      .then((data: AlertItem[]) => setAlerts(data))
      .catch(() => {});
  }, []);

  // ── WebSocket to /ws/dashboard ────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsState('connecting');
    const ws = new WebSocket(`${WS}/ws/dashboard`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState('connected');
      clearTimeout(retryTimer.current);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        if (msg.type === 'telemetry_update' && msg.data) {
          const d: Telemetry = msg.data;
          setTele(d);
          setHistory(h => [
            ...h.slice(-59),
            { t: new Date().toLocaleTimeString('en', { hour12: false }), fs: d.fatigue_score ?? 0 },
          ]);
        }

        if (msg.type === 'alert' && msg.data) {
          setAlerts(a => [msg.data as AlertItem, ...a.slice(0, 49)]);
        }

        // keep-alive pong
        if (msg.type === 'ping') ws.send('ping');

      } catch { /* ignore parse errors */ }
    };

    ws.onerror  = () => setWsState('disconnected');
    ws.onclose  = () => {
      setWsState('disconnected');
      retryTimer.current = setTimeout(connect, 4000);
    };
  }, []);

  useEffect(() => {
    connect();
    const hb = setInterval(() => wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send('ping'), 25000);
    return () => {
      clearInterval(hb);
      clearTimeout(retryTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const status     = tele.driver_status ?? 'NORMAL';
  const fs         = tele.fatigue_score ?? 0;
  const connected  = wsState === 'connected';
  const hasData    = Object.keys(tele).length > 0;
  const videoSrc   = `${API}/video_feed`;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Monitoring</h1>
          <p className="text-sm text-neutral-400 mt-1">Real-time VigilDrive AI telemetry + webcam feed</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WS status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold
            ${connected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {wsState === 'connecting' ? 'Connecting…' : connected ? 'LIVE' : 'Disconnected'}
          </div>
          {/* video toggle */}
          <button
            onClick={() => { setShowVideo(v => !v); setImgError(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 hover:border-neutral-500 transition"
          >
            {showVideo ? <CameraOff size={12} /> : <Camera size={12} />}
            {showVideo ? 'Hide Feed' : 'Show Feed'}
          </button>
        </div>
      </div>

      {/* ── Driver status banner ── */}
      {hasData && (
        <div className={`rounded-xl border px-5 py-3 flex items-center gap-4 ${STATUS_BG[status] ?? STATUS_BG.NORMAL}`}>
          <div className={`text-xl font-black tracking-widest font-mono ${STATUS_COLORS[status] ?? 'text-white'}`}>
            {status}
          </div>
          <div className="flex-1">
            <Bar value={fs} max={100} color="auto" />
          </div>
          <div className="font-mono text-white font-bold">{fs}<span className="text-neutral-500 text-sm">/100</span></div>
          {tele.calibrated === false && (
            <span className="text-xs text-amber-400 font-semibold animate-pulse">
              CALIBRATING… {tele.calibration_remaining ?? 0}s
            </span>
          )}
          {tele.calibrated && (
            <span className="text-xs text-green-400 font-semibold">AI ACTIVE</span>
          )}
        </div>
      )}

      {/* ── Two-column layout: video + metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Video feed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-widest">Webcam Feed</span>
            </div>
            <span className="text-xs text-neutral-600 font-mono">{tele.fps ? `${tele.fps} fps` : ''}</span>
          </div>

          <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
            {showVideo && !imgError ? (
              <>
                {/* MJPEG stream from FastAPI /video_feed */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoSrc}
                  alt="Live webcam"
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
                {/* Overlay HUD */}
                {hasData && (
                  <div className="absolute top-2 left-2 space-y-1 pointer-events-none">
                    <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded
                      ${status === 'DANGER' ? 'bg-red-600 text-white' :
                        status === 'DROWSY' ? 'bg-orange-500 text-white' :
                        status === 'TIRED'  ? 'bg-amber-500 text-black' :
                                              'bg-green-500 text-black'}`}>
                      {status}
                    </div>
                    <div className="bg-black/70 text-green-400 text-xs font-mono px-2 py-0.5 rounded">
                      EAR {tele.ear?.toFixed(3)} | MAR {tele.mar?.toFixed(3)}
                    </div>
                    <div className="bg-black/70 text-blue-400 text-xs font-mono px-2 py-0.5 rounded">
                      YAW {tele.yaw?.toFixed(1)}° | PITCH {tele.pitch?.toFixed(1)}°
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-3">
                <Camera size={48} className="opacity-30" />
                <p className="text-sm">
                  {imgError
                    ? 'Camera stream unavailable — run vigildrive-ai/main.py first'
                    : 'Feed hidden'}
                </p>
                {imgError && (
                  <button
                    onClick={() => setImgError(false)}
                    className="text-xs text-blue-400 underline"
                  >Retry</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Metrics grid */}
        <div className="space-y-4">

          {/* Eye metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Fatigue Score" value={fs} unit="/100"
              warn={fs >= 70} icon={Brain} />
            <MetricCard label="Attention" value={tele.average_attention?.toFixed(0) ?? '—'} unit="%"
              warn={(tele.average_attention ?? 100) < 50} icon={Eye} />
            <MetricCard label="EAR" value={tele.ear?.toFixed(3) ?? '—'}
              warn={(tele.ear ?? 1) < 0.22} icon={Eye} />
            <MetricCard label="MAR" value={tele.mar?.toFixed(3) ?? '—'}
              warn={(tele.mar ?? 0) > 0.65} icon={Wind} />
          </div>

          {/* Head pose */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-3">Head Pose</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Yaw',   value: tele.yaw?.toFixed(1)   ?? '—', unit: '°' },
                { label: 'Pitch', value: tele.pitch?.toFixed(1)  ?? '—', unit: '°' },
                { label: 'Gaze',  value: tele.gaze_direction ?? '—' },
              ].map(m => (
                <div key={m.label} className="bg-neutral-900 rounded-lg p-2">
                  <div className="text-[10px] text-neutral-500 mb-1">{m.label}</div>
                  <div className="text-sm font-bold font-mono text-white">{m.value}{m.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session stats */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} className="text-neutral-400" />
              <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">Session</p>
              <span className="ml-auto font-mono text-sm text-white">
                {tele.session_duration !== undefined ? fmtDuration(tele.session_duration) : '—'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Blinks',  value: tele.total_blinks       ?? '—' },
                { label: 'Yawns',   value: tele.total_yawns        ?? '—' },
                { label: 'Distr.',  value: tele.total_distractions ?? '—' },
                { label: 'Risk',    value: tele.driver_risk         ?? '—' },
              ].map(m => (
                <div key={m.label} className="bg-neutral-900 rounded-lg py-2">
                  <div className="text-[10px] text-neutral-500 mb-1">{m.label}</div>
                  <div className="text-sm font-bold font-mono text-white">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Boolean flags */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Drowsy',     value: tele.drowsy     },
              { label: 'Yawning',    value: tele.yawning    },
              { label: 'Distracted', value: tele.distracted },
            ].map(f => (
              <div key={f.label}
                className={`rounded-lg border py-2 text-center text-xs font-bold uppercase
                  ${f.value
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                {f.label}: {f.value ? 'YES' : 'NO'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mini sparkline (last 60 samples) ── */}
      {history.length > 1 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">
            Fatigue History — last {history.length} samples
          </p>
          <div className="flex items-end gap-px h-16">
            {history.map((h, i) => {
              const pct = h.fs / 100;
              const color = h.fs >= 70 ? '#ef4444' : h.fs >= 45 ? '#f97316' : '#22c55e';
              return (
                <div key={i} title={`${h.t}: ${h.fs}`}
                  className="flex-1 rounded-sm transition-all"
                  style={{ height: `${Math.max(4, pct * 100)}%`, background: color }} />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Live Alert Feed ── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-400" />
            <span className="text-sm font-bold text-white">Alert Feed</span>
            {alerts.filter(a => !a['acknowledged']).length > 0 && (
              <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                {alerts.filter(a => !a['acknowledged']).length}
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-600">{alerts.length} total</span>
        </div>

        {alerts.length === 0 && (
          <p className="text-sm text-neutral-600 text-center py-4">No alerts yet</p>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {alerts.slice(0, 20).map((a, i) => (
            <div key={a.id ?? i}
              className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800 border border-neutral-700">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                ${a.severity === 'critical' ? 'bg-red-400' :
                  a.severity === 'high'     ? 'bg-orange-400' :
                  a.severity === 'medium'   ? 'bg-amber-400' : 'bg-green-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-200">
                    {a.alert_type?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${SEV_COLORS[a.severity] ?? ''}`}>
                    {a.severity?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 truncate">{a.message}</p>
              </div>
              <span className="text-[10px] text-neutral-600 flex-shrink-0">
                {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Not connected hint ── */}
      {!connected && !hasData && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 text-center space-y-2">
          <Activity size={32} className="text-neutral-600 mx-auto" />
          <p className="text-sm font-semibold text-neutral-400">Waiting for VigilDrive AI…</p>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Start the Python AI process:<br />
            <code className="text-blue-400">cd vigildrive-ai &amp;&amp; python main.py</code>
            <br />then start the backend:&nbsp;
            <code className="text-blue-400">cd backend &amp;&amp; uvicorn main:app --reload</code>
          </p>
        </div>
      )}
    </div>
  );
}