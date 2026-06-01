'use client';

import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNavbar />

      {/* Main content area */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="ml-64 mt-24 px-6 pb-6 transition-all duration-300"
      >
        {children}
      </motion.main>
    </div>
  );
}
