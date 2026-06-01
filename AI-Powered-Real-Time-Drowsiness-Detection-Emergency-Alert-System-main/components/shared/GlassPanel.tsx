'use client';

import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glowColor?: 'cyan' | 'blue' | 'purple';
}

export default function GlassPanel({
  children,
  className = '',
  hover = false,
  glowColor = 'cyan',
}: GlassPanelProps) {
  const glowClass = {
    cyan: 'hover:shadow-glow-cyan-lg hover:border-accent-cyan/40',
    blue: 'hover:shadow-glow-blue-lg hover:border-accent-blue/40',
    purple: 'hover:shadow-glow-purple-lg hover:border-accent-purple/40',
  }[glowColor];

  return (
    <div
      className={`
        glass-panel
        ${hover ? `cursor-pointer ${glowClass} hover:scale-[1.02]` : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
