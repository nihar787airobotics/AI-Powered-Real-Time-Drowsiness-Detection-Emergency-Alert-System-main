'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import GlassPanel from '@/components/shared/GlassPanel';
import { alertsTimeline } from '@/lib/mockData';

const severityConfig = {
  critical: {
    bg: 'bg-accent-red/10',
    border: 'border-accent-red/30',
    text: 'text-accent-red',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-accent-orange/10',
    border: 'border-accent-orange/30',
    text: 'text-accent-orange',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/30',
    text: 'text-accent-cyan',
    icon: Info,
  },
};

export default function EventsAlertPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        Events & Alerts Timeline
      </motion.h2>

      <GlassPanel className="p-6">
        <motion.div className="space-y-3 max-h-96 overflow-y-auto pr-4">
          {alertsTimeline.map((alert, idx) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`
                  ${config.bg} ${config.border}
                  border rounded-lg p-4 flex items-start gap-4
                  hover:shadow-lg transition-all duration-200
                `}
              >
                {/* Icon */}
                <motion.div
                  className={`flex-shrink-0 mt-1 ${config.text}`}
                  whileHover={{ scale: 1.2 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-semibold text-sm ${config.text}`}>
                        {alert.type}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.description}
                      </p>
                    </div>
                    <time className="text-xs text-gray-500 flex-shrink-0">
                      {alert.timestamp}
                    </time>
                  </div>

                  {/* Severity badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 + 0.1 }}
                    className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium
                      ${config.bg} ${config.text}`}
                  >
                    {alert.severity.charAt(0).toUpperCase() +
                      alert.severity.slice(1)}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer stat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 pt-4 border-t border-border flex items-center justify-between"
        >
          <span className="text-sm text-gray-400">
            Total Events: <span className="font-bold text-accent-cyan">{alertsTimeline.length}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-accent-red">
              Critical: <span className="font-bold">1</span>
            </span>
            <span className="text-xs text-accent-orange">
              Warning: <span className="font-bold">4</span>
            </span>
          </div>
        </motion.div>
      </GlassPanel>
    </motion.section>
  );
}
