'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  User,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
  { icon: Radio, label: 'Live Monitoring', href: '#' },
  { icon: Zap, label: 'Sessions', href: '#' },
  { icon: Bell, label: 'Events & Alerts', href: '#' },
  { icon: BarChart3, label: 'Analytics', href: '#' },
  { icon: Settings, label: 'Settings', href: '#' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      initial={{ x: isOpen ? 0 : -256 }}
      animate={{ x: 0 }}
      className={`
        fixed left-0 top-0 h-screen bg-background-secondary/80 backdrop-blur-lg
        border-r border-border transition-all duration-300 z-40
        ${isOpen ? 'w-64' : 'w-20'}
        flex flex-col
      `}
    >
      {/* Logo */}
      <motion.div
        className="flex items-center justify-between p-6 border-b border-border"
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          initial={{ opacity: isOpen ? 1 : 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">VigilDrive</span>
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item, idx) => (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  text-gray-400 hover:text-accent-cyan
                  hover:bg-accent-cyan/10
                  transition-all duration-200
                  ${idx === 0 ? 'bg-accent-cyan/10 text-accent-cyan' : ''}
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  initial={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                  animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <motion.div
        className="p-4 border-t border-border space-y-2"
        whileHover={{ scale: 1.02 }}
      >
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-gray-400 hover:text-accent-cyan hover:bg-accent-cyan/10
            transition-all duration-200"
        >
          <User className="w-5 h-5" />
          <motion.span
            initial={{ opacity: isOpen ? 1 : 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="text-sm"
          >
            Profile
          </motion.span>
        </button>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-gray-400 hover:text-accent-red hover:bg-accent-red/10
            transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <motion.span
            initial={{ opacity: isOpen ? 1 : 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="text-sm"
          >
            Logout
          </motion.span>
        </button>
      </motion.div>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-8 bg-accent-cyan/10 hover:bg-accent-cyan/20
          border border-accent-cyan/30 rounded-full p-1.5 transition-all"
      >
        <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <Zap className="w-3 h-3 text-accent-cyan" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
