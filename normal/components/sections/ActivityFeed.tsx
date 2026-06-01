'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/shared/GlassPanel';
import { activityLog } from '@/lib/mockData';

const getLogColor = (log: string) => {
  if (log.includes('ALERT') || log.includes('CRITICAL')) {
    return 'text-accent-red';
  }
  if (log.includes('WARNING')) {
    return 'text-accent-orange';
  }
  if (log.includes('INFO')) {
    return 'text-accent-cyan';
  }
  return 'text-gray-400';
};

export default function ActivityFeed() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        Live Activity Log
      </motion.h2>

      <GlassPanel className="p-6">
        <motion.div
          className="space-y-2 max-h-80 overflow-y-auto font-mono text-sm pr-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.03,
              },
            },
          }}
        >
          {activityLog.map((log, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { type: 'spring', stiffness: 300 },
                },
              }}
              className="flex items-start gap-3 py-1"
            >
              {/* Animated line connector */}
              <motion.div
                className="text-accent-cyan/30 flex-shrink-0 w-6 text-right"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.05 }}
              >
                →
              </motion.div>

              {/* Log text */}
              <motion.span
                className={`flex-1 ${getLogColor(log)}`}
                whileHover={{ paddingLeft: '8px' }}
              >
                {log}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-gray-500"
        >
          <span>System logs • Last 12 entries</span>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>
            <span>●</span>
          </motion.div>
        </motion.div>
      </GlassPanel>
    </motion.section>
  );
}
