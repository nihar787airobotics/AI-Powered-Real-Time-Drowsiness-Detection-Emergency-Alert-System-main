'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data for demonstration
const mockWeeklyData = [
  { day: 'Mon', hours: 8.5, alerts: 2, safety_score: 98 },
  { day: 'Tue', hours: 9.2, alerts: 1, safety_score: 99 },
  { day: 'Wed', hours: 7.8, alerts: 3, safety_score: 96 },
  { day: 'Thu', hours: 8.9, alerts: 2, safety_score: 97 },
  { day: 'Fri', hours: 9.5, alerts: 4, safety_score: 95 },
  { day: 'Sat', hours: 6.2, alerts: 1, safety_score: 99 },
  { day: 'Sun', hours: 5.1, alerts: 0, safety_score: 100 },
];

const mockAlertDistribution = [
  { name: 'Drowsiness', value: 8 },
  { name: 'Harsh Braking', value: 5 },
  { name: 'Harsh Acceleration', value: 3 },
  { name: 'Phone Use', value: 2 },
  { name: 'Other', value: 1 },
];

const mockMonthlyTrend = [
  { week: 'Week 1', avg_score: 96.5, trips: 12 },
  { week: 'Week 2', avg_score: 95.8, trips: 14 },
  { week: 'Week 3', avg_score: 97.2, trips: 11 },
  { week: 'Week 4', avg_score: 96.1, trips: 13 },
];

const COLORS = ['#ff6b35', '#00d4ff', '#7c3aed', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = mockWeeklyData.reduce((sum, d) => sum + d.hours, 0);
    const totalAlerts = mockWeeklyData.reduce((sum, d) => sum + d.alerts, 0);
    const avgSafety = (
      mockWeeklyData.reduce((sum, d) => sum + d.safety_score, 0) /
      mockWeeklyData.length
    ).toFixed(1);

    return {
      totalHours: totalHours.toFixed(1),
      totalAlerts,
      avgSafety,
      totalTrips: mockWeeklyData.length,
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics & Insights</h1>
        <p className="text-neutral-400">Comprehensive driver performance metrics and trends</p>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === range
                ? 'bg-primary text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <div className="text-sm font-semibold text-neutral-400 mb-2">Total Hours</div>
          <div className="text-3xl font-bold text-foreground">{stats.totalHours}</div>
          <div className="text-xs text-neutral-500 mt-2">hours driven</div>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <div className="text-sm font-semibold text-neutral-400 mb-2">Total Alerts</div>
          <div className="text-3xl font-bold text-danger">{stats.totalAlerts}</div>
          <div className="text-xs text-neutral-500 mt-2">detected events</div>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <div className="text-sm font-semibold text-neutral-400 mb-2">Avg Safety Score</div>
          <div className="text-3xl font-bold text-success">{stats.avgSafety}%</div>
          <div className="text-xs text-neutral-500 mt-2">overall performance</div>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <div className="text-sm font-semibold text-neutral-400 mb-2">Total Trips</div>
          <div className="text-3xl font-bold text-secondary">{stats.totalTrips}</div>
          <div className="text-xs text-neutral-500 mt-2">journeys completed</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Weekly Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid #444',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="safety_score"
                stroke="#10b981"
                strokeWidth={2}
                name="Safety Score"
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#00d4ff"
                strokeWidth={2}
                name="Hours Driven"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Distribution */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Alert Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockAlertDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {mockAlertDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid #444',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Alerts */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Daily Alerts</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid #444',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="alerts" fill="#ff6b35" name="Alerts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockMonthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="week" stroke="#888" />
              <YAxis stroke="#888" yAxisId="left" />
              <YAxis stroke="#888" yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid #444',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="avg_score" fill="#10b981" name="Safety Score" />
              <Bar yAxisId="right" dataKey="trips" fill="#00d4ff" name="Total Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Key Insights</h2>
        <ul className="space-y-3 text-sm text-neutral-300">
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">→</span>
            <span>Your safety score has improved by 2.1% compared to last month</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-secondary font-bold">→</span>
            <span>Drowsiness-related alerts are your most common event type (40% of total)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-accent font-bold">→</span>
            <span>Friday had the highest alert count (4) - consider additional rest before weekend driving</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-success font-bold">→</span>
            <span>Your driving hours are well-balanced - excellent adherence to safety guidelines</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
