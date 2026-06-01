'use client';

import { motion } from 'framer-motion';

interface PulseIndicatorProps {
  status: 'active' | 'warning' | 'error' | 'idle';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  active: {
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    label: 'Active',
  },
  warning: {
    color: '#ff6600',
    glowColor: 'rgba(255, 102, 0, 0.5)',
    label: 'Warning',
  },
  error: {
    color: '#ff0000',
    glowColor: 'rgba(255, 0, 0, 0.5)',
    label: 'Error',
  },
  idle: {
    color: '#666666',
    glowColor: 'rgba(102, 102, 102, 0.3)',
    label: 'Idle',
  },
};

const sizeConfig = {
  sm: { outer: 'w-2 h-2', inner: 'w-1 h-1' },
  md: { outer: 'w-3 h-3', inner: 'w-1.5 h-1.5' },
  lg: { outer: 'w-4 h-4', inner: 'w-2 h-2' },
};

export default function PulseIndicator({
  status,
  label,
  size = 'md',
}: PulseIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          className={`${sizes.outer} rounded-full absolute inset-0`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            backgroundColor: config.glowColor,
          }}
        />
        <div
          className={`${sizes.outer} rounded-full`}
          style={{ backgroundColor: config.color }}
        />
      </div>
      {label && <span className="text-xs font-medium text-gray-400">{label}</span>}
    </div>
  );
}
