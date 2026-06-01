'use client';

import { Bell, Circle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PulseIndicator from '@/components/shared/PulseIndicator';

export default function TopNavbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-64 right-0 bg-background-secondary/40 backdrop-blur-lg
        border-b border-border z-30 transition-all duration-300"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left side - Title */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
          <p className="text-xs text-gray-500">Real-time AI monitoring</p>
        </motion.div>

        {/* Right side - Status and controls */}
        <div className="flex items-center gap-6">
          {/* System Status */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <PulseIndicator status="active" label="System Online" />
          </motion.div>

          {/* Driver Presence */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Circle className="w-3 h-3 text-accent-green fill-accent-green" />
            <span className="text-sm text-gray-300">Driver Present</span>
          </motion.div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-accent-cyan/10
              text-accent-cyan transition-all"
          >
            <Bell className="w-5 h-5" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full"
            />
          </motion.button>

          {/* Profile Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue
              flex items-center justify-center cursor-pointer"
          >
            <span className="text-xs font-bold text-white">AD</span>
          </motion.div>
        </div>
      </div>

      {/* Live telemetry pulse at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent-cyan via-accent-blue to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        style={{ originX: 0 }}
      />
    </motion.header>
  );
}
