'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Eye,
  Gauge,
  Heart,
  TrendingUp,
  Zap,
} from 'lucide-react';
import TelemetryCard from '@/components/cards/TelemetryCard';
import { telemetryData } from '@/lib/mockData';

export default function HeroTelemetry() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mb-8"
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6 gradient-text"
      >
        Real-Time Telemetry
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        <TelemetryCard
          title="Fatigue Score"
          value={telemetryData.fatigueScore.value}
          trend={telemetryData.fatigueScore.trend}
          suffix="%"
          icon={<Heart className="w-6 h-6" />}
          status={telemetryData.fatigueScore.status}
          glowColor="cyan"
          sparkline={telemetryData.fatigueScore.sparkline}
        />

        <TelemetryCard
          title="Attention Score"
          value={telemetryData.attentionScore.value}
          trend={telemetryData.attentionScore.trend}
          suffix="%"
          icon={<Eye className="w-6 h-6" />}
          status={telemetryData.attentionScore.status}
          glowColor="blue"
          sparkline={telemetryData.attentionScore.sparkline}
        />

        <TelemetryCard
          title="Risk Level"
          value={telemetryData.riskLevel.value}
          trend={telemetryData.riskLevel.trend}
          suffix="%"
          icon={<AlertCircle className="w-6 h-6" />}
          status={telemetryData.riskLevel.status}
          glowColor="purple"
          sparkline={telemetryData.riskLevel.sparkline}
        />

        <TelemetryCard
          title="Gaze Tracking"
          value={telemetryData.gazeDirection.value}
          trend={telemetryData.gazeDirection.trend}
          suffix="%"
          icon={<Eye className="w-6 h-6" />}
          status={telemetryData.gazeDirection.status}
          glowColor="cyan"
          sparkline={telemetryData.gazeDirection.sparkline}
        />

        <TelemetryCard
          title="Active Alerts"
          value={telemetryData.activeAlerts.value}
          icon={<Zap className="w-6 h-6" />}
          status={telemetryData.activeAlerts.status}
          glowColor="blue"
        />

        <TelemetryCard
          title="Session Duration"
          value={telemetryData.sessionDuration.value}
          suffix=" min"
          icon={<Gauge className="w-6 h-6" />}
          status={telemetryData.sessionDuration.status}
          glowColor="purple"
        />
      </motion.div>
    </motion.section>
  );
}
