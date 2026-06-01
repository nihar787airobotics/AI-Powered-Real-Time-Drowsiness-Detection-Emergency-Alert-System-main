'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Database,
  Gauge,
  GitBranch,
  Network,
  Zap,
} from 'lucide-react';
import GlassPanel from '@/components/shared/GlassPanel';
import PulseIndicator from '@/components/shared/PulseIndicator';
import { aiSystemStatus } from '@/lib/mockData';

const statusItems = [
  {
    icon: Zap,
    label: 'Camera Status',
    value: aiSystemStatus.cameraStatus,
    status: 'active' as const,
  },
  {
    icon: Activity,
    label: 'AI Inference',
    value: aiSystemStatus.aiInference,
    status: 'active' as const,
  },
  {
    icon: GitBranch,
    label: 'Tracking Accuracy',
    value: aiSystemStatus.trackingAccuracy,
    status: 'active' as const,
  },
  {
    icon: Database,
    label: 'DB Sync',
    value: aiSystemStatus.dbSync,
    status: 'active' as const,
  },
  {
    icon: Gauge,
    label: 'Latency',
    value: aiSystemStatus.latency,
    status: 'active' as const,
  },
  {
    icon: Network,
    label: 'Cloud Sync',
    value: aiSystemStatus.cloudSync,
    status: 'active' as const,
  },
];

export default function AISystemStatus() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        AI System Status
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {statusItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassPanel className="p-6 relative overflow-hidden group">
                {/* Background glow on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-accent-cyan/0 to-transparent
                    group-hover:from-accent-cyan/10 transition-all duration-300"
                />

                <div className="relative z-10">
                  {/* Icon and label */}
                  <div className="flex items-center justify-between mb-3">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="text-accent-cyan"
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                    <PulseIndicator status={item.status} size="sm" />
                  </div>

                  {/* Label */}
                  <p className="text-sm text-gray-400 mb-2">{item.label}</p>

                  {/* Value */}
                  <motion.p
                    key={item.value}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-2xl font-bold text-accent-cyan"
                  >
                    {item.value}
                  </motion.p>

                  {/* Subtle progress indicator */}
                  <motion.div
                    className="mt-3 h-1 bg-background-tertiary rounded-full overflow-hidden"
                    whileHover={{ scaleY: 1.5 }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, delay: idx * 0.1 }}
                    />
                  </motion.div>
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
