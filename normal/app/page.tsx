'use client';

import MainLayout from '@/components/layout/MainLayout';
import HeroTelemetry from '@/components/sections/HeroTelemetry';
import DriverMonitoringPanel from '@/components/sections/DriverMonitoringPanel';
import AnalyticsCharts from '@/components/sections/AnalyticsCharts';
import EventsAlertPanel from '@/components/sections/EventsAlertPanel';
import SessionTable from '@/components/sections/SessionTable';
import AISystemStatus from '@/components/sections/AISystemStatus';
import ActivityFeed from '@/components/sections/ActivityFeed';

export default function Dashboard() {
  return (
    <MainLayout>
      <HeroTelemetry />
      <DriverMonitoringPanel />
      <AnalyticsCharts />
      <EventsAlertPanel />
      <SessionTable />
      <AISystemStatus />
      <ActivityFeed />
    </MainLayout>
  );
}
