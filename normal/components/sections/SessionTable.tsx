'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/shared/GlassPanel';
import { sessionTable } from '@/lib/mockData';

const riskColors = {
  Low: 'bg-accent-green/10 text-accent-green',
  Medium: 'bg-accent-orange/10 text-accent-orange',
  High: 'bg-accent-red/10 text-accent-red',
  Critical: 'bg-accent-red/20 text-accent-red',
};

export default function SessionTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        Session History
      </motion.h2>

      <GlassPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="border-b border-border bg-background-tertiary/50">
              <tr>
                {[
                  'Duration',
                  'Blinks',
                  'Yawns',
                  'Distractions',
                  'Avg Fatigue',
                  'Risk Level',
                ].map((header, idx) => (
                  <motion.th
                    key={header}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + idx * 0.05 }}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-300"
                  >
                    {header}
                  </motion.th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {sessionTable.map((session, rowIdx) => (
                <motion.tr
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + rowIdx * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(0, 240, 255, 0.05)' }}
                  className="border-b border-border/50 hover:border-border transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {session.duration}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {session.blinks}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {session.yawns}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {session.distractions}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <motion.span
                      className="text-accent-cyan font-semibold"
                      whileHover={{ scale: 1.1 }}
                    >
                      {session.fatigueAvg}%
                    </motion.span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <motion.span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                        ${riskColors[session.riskLevel as keyof typeof riskColors]}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {session.riskLevel}
                    </motion.span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="px-6 py-4 border-t border-border bg-background-tertiary/30
            flex items-center justify-between text-sm text-gray-400"
        >
          <span>Showing 5 of 247 sessions</span>
          <button className="text-accent-cyan hover:text-accent-cyan/80 transition">
            View All Sessions →
          </button>
        </motion.div>
      </GlassPanel>
    </motion.section>
  );
}
