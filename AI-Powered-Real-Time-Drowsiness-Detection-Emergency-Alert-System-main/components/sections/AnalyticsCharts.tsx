'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import GlassPanel from '@/components/shared/GlassPanel';
import { chartData } from '@/lib/mockData';

const chartConfig = {
  contentStyle: {
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    border: '1px solid rgba(0, 240, 255, 0.1)',
    borderRadius: '8px',
  },
  labelStyle: {
    color: '#888888',
    fontSize: 12,
  },
};

export default function AnalyticsCharts() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        Analytics & Trends
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fatigue Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-accent-cyan mb-4">
              Fatigue Trend (24h)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.fatigueTimeline}>
                <defs>
                  <linearGradient id="fatigue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
                <XAxis dataKey="time" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={chartConfig.contentStyle}
                  labelStyle={chartConfig.labelStyle}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </GlassPanel>
        </motion.div>

        {/* Attention Stability */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 }}
        >
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-accent-blue mb-4">
              Attention Stability (24h)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.attentionStability}>
                <defs>
                  <linearGradient id="attention-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 102, 255, 0.1)" />
                <XAxis dataKey="time" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={chartConfig.contentStyle}
                  labelStyle={chartConfig.labelStyle}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  fill="url(#attention-gradient)"
                  stroke="#0066ff"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassPanel>
        </motion.div>

        {/* Distraction Frequency */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-accent-purple mb-4">
              Distraction Events (24h)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.distractionFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="time" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={chartConfig.contentStyle}
                  labelStyle={chartConfig.labelStyle}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  isAnimationActive={true}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassPanel>
        </motion.div>

        {/* Composite Metrics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.65 }}
        >
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-accent-cyan mb-4">
              Composite Metrics (24h)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={chartData.fatigueTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
                <XAxis dataKey="time" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={chartConfig.contentStyle}
                  labelStyle={chartConfig.labelStyle}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  name="System Load"
                  isAnimationActive={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </GlassPanel>
        </motion.div>
      </div>
    </motion.section>
  );
}
