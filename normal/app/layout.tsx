import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VigilDrive AI - Driver Monitoring Dashboard',
  description: 'Ultra-premium AI-powered driver monitoring dashboard with real-time drowsiness detection and safety alerts.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
