'use client';

import { motion } from 'framer-motion';
import React from 'react';
import GlassPanel from '@/components/shared/GlassPanel';
import AnimatedValue from '@/components/shared/AnimatedValue';

interface TelemetryCardProps {
  title: string;
  value: number;
  suffix?: string;
  trend?: number;
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
  glowColor?: 'cyan' | 'blue' | 'purple';
  sparkline?: number[];
}

const statusColors = {
  normal: 'text-accent-green',
  warning: 'text-accent-orange',
  critical: 'text-accent-red',
};

const statusGlow = {
  normal: 'shadow-glow-cyan',
  warning: 'shadow-glow-cyan',
  critical: 'shadow-glow-cyan',
};

export default function TelemetryCard({
  title,
  value,
  suffix = '',
  trend = 0,
  icon,
  status = 'normal',
  glowColor = 'cyan',
  sparkline = [],
}: TelemetryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassPanel
        hover
        glowColor={glowColor}
        className="p-6 relative overflow-hidden"
      >
        {/* Background glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at top right, ${
              glowColor === 'cyan'
                ? 'rgba(0, 240, 255, 0.1)'
                : glowColor === 'blue'
                  ? 'rgba(0, 102, 255, 0.1)'
                  : 'rgba(139, 92, 246, 0.1)'
            }, transparent)`,
          }}
        />

        <div className="relative z-10">
          {/* Header with icon and title */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
              <motion.div
                key={value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <AnimatedValue
                  value={value}
                  suffix={suffix}
                  trend={trend}
                  decimals={1}
                />
              </motion.div>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              className={`${statusColors[status]} opacity-80`}
            >
              {icon}
            </motion.div>
          </div>

          {/* Status indicator */}
          {status !== 'normal' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                status === 'warning'
                  ? 'bg-accent-orange/20 text-accent-orange'
                  : 'bg-accent-red/20 text-accent-red'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </motion.div>
          )}

          {/* Mini sparkline visualization */}
          {sparkline.length > 0 && (
            <div className="mt-4 h-12 flex items-end gap-1">
              {sparkline.map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ height: 0 }}
                  animate={{ height: `${(value / 100) * 100}%` }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex-1 bg-gradient-to-t from-accent-cyan to-accent-blue opacity-60 rounded-t"
                />
              ))}
            </div>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
}
