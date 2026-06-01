'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/shared/GlassPanel';
import PulseIndicator from '@/components/shared/PulseIndicator';

export default function DriverMonitoringPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        Live Driver Monitoring
      </motion.h2>

      <GlassPanel className="p-6 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video/Webcam area */}
          <motion.div
            className="lg:col-span-2 relative aspect-video rounded-lg
              bg-gradient-to-br from-background-tertiary via-background-secondary to-background
              border border-accent-cyan/30 overflow-hidden group shadow-glow-cyan"
            whileHover={{ borderColor: 'rgba(0, 240, 255, 0.6)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.4)' }}
          >
            {/* Camera feed background with grid pattern */}
            <div className="absolute inset-0">
              {/* Grid pattern for visual depth */}
              <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent-cyan" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-accent-blue/5" />
            </div>

            {/* Animated scan lines */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-cyan/10 to-transparent
                pointer-events-none"
              animate={{ y: ['0%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Face tracking box and markers */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Main face detection box */}
              <motion.div
                className="relative w-48 h-56 border-2 border-accent-cyan/60 rounded-lg"
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* Corner markers */}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
                  <div
                    key={corner}
                    className={`absolute w-3 h-3 border-2 border-accent-cyan ${
                      corner === 'top-left'
                        ? 'top-0 left-0'
                        : corner === 'top-right'
                          ? 'top-0 right-0'
                          : corner === 'bottom-left'
                            ? 'bottom-0 left-0'
                            : 'bottom-0 right-0'
                    }`}
                  />
                ))}

                {/* Eye detection circles */}
                <div className="absolute top-12 left-8 w-4 h-4 border border-accent-blue/70 rounded-full" />
                <div className="absolute top-12 right-8 w-4 h-4 border border-accent-blue/70 rounded-full" />

                {/* Nose point */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-accent-green rounded-full -translate-x-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Side info panels */}
              <motion.div
                className="absolute right-6 top-1/2 -translate-y-1/2 space-y-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="text-xs text-accent-cyan font-mono">Face: Detected</div>
                <div className="text-xs text-accent-blue font-mono">Eyes: Open</div>
                <div className="text-xs text-accent-green font-mono">Gaze: Forward</div>
              </motion.div>
            </div>

            {/* Camera label */}
            <motion.div
              className="absolute top-4 left-4 flex items-center gap-2 z-10"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <PulseIndicator status="active" size="sm" />
              <span className="text-xs font-semibold text-accent-cyan">HD Camera</span>
            </motion.div>

            {/* Resolution indicator */}
            <div className="absolute bottom-4 right-4 text-xs text-accent-cyan/70 font-mono">
              1920x1080 @ 30fps
            </div>
          </motion.div>

          {/* Right side metrics */}
          <motion.div className="space-y-4">
            {/* Eye Status */}
            <motion.div
              className="glass-panel p-4 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs text-gray-500 mb-2">Eye Detection</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-accent-cyan">Both Eyes</span>
                <PulseIndicator status="active" size="sm" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Tracking: 98.5%</p>
            </motion.div>

            {/* Attention Level */}
            <motion.div
              className="glass-panel p-4 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs text-gray-500 mb-2">Attention Level</p>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-accent-cyan to-accent-blue h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '87%' }}
                  transition={{ duration: 2 }}
                />
              </div>
              <p className="text-sm font-bold text-accent-cyan mt-2">87%</p>
            </motion.div>

            {/* Fatigue Indicator */}
            <motion.div
              className="glass-panel p-4 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs text-gray-500 mb-2">Fatigue Level</p>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-accent-orange to-accent-red h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '32%' }}
                  transition={{ duration: 2 }}
                />
              </div>
              <p className="text-sm font-bold text-accent-orange mt-2">32%</p>
            </motion.div>

            {/* Head Position */}
            <motion.div
              className="glass-panel p-4 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs text-gray-500 mb-2">Head Position</p>
              <span className="text-sm font-semibold text-accent-green">Centered</span>
              <p className="text-xs text-gray-400 mt-1">X: +2° Y: -1°</p>
            </motion.div>
          </motion.div>
        </div>
      </GlassPanel>
    </motion.section>
  );
}
