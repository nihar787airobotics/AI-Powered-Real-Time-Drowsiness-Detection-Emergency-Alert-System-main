'use client';

import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface AnimatedValueProps {
  value: number;
  trend?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export default function AnimatedValue({
  value,
  trend = 0,
  suffix = '',
  prefix = '',
  decimals = 1,
}: AnimatedValueProps) {
  const displayValue = value.toFixed(decimals);
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-bold text-accent-cyan"
      >
        {prefix}
        {displayValue}
        {suffix}
      </motion.div>
      {trend !== 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={`flex items-center gap-0.5 text-sm font-semibold ${
            isPositive ? 'text-accent-green' : 'text-accent-orange'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(trend)}%
        </motion.div>
      )}
    </div>
  );
}
