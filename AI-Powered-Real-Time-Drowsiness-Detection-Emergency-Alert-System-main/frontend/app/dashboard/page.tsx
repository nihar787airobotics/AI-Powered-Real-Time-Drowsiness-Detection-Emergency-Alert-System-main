'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, TrendingUp, Users } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeDrivers: 0,
    alertsToday: 0,
    avgDrowsiness: 0,
    vehiclesOnline: 0,
  });

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.log('[v0] Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: Users,
      color: 'from-secondary to-blue-500',
      change: '+12% from yesterday',
    },
    {
      title: 'Alerts Today',
      value: stats.alertsToday,
      icon: AlertCircle,
      color: 'from-danger to-orange-500',
      change: '-5% from yesterday',
    },
    {
      title: 'Avg Drowsiness',
      value: `${stats.avgDrowsiness}%`,
      icon: Activity,
      color: 'from-warning to-yellow-500',
      change: 'Real-time average',
    },
    {
      title: 'Vehicles Online',
      value: stats.vehiclesOnline,
      icon: TrendingUp,
      color: 'from-success to-green-500',
      change: 'All connected',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-neutral-800 to-neutral-700 border border-neutral-700 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-neutral-400">Monitor your fleet in real-time with AI-powered drowsiness detection</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-neutral-600 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-neutral-400 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <p className="text-xs text-neutral-500">{card.change}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drowsiness Trend */}
        <div className="lg:col-span-2 bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Drowsiness Detection Trend</h2>
          <div className="h-64 bg-neutral-700/30 rounded-lg flex items-center justify-center text-neutral-500">
            <p>Chart will appear here (Phase 5: Analytics)</p>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Alert Summary</h2>
          <div className="space-y-3">
            {['Critical', 'Warning', 'Info'].map((level, idx) => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">{level}</span>
                <span className={`font-bold ${idx === 0 ? 'text-danger' : idx === 1 ? 'text-warning' : 'text-info'}`}>
                  {Math.floor(Math.random() * 20)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-2 text-neutral-400 text-sm">
          <p>No recent activity to display</p>
        </div>
      </div>
    </div>
  );
}
