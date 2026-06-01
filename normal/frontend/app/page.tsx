'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col">
      {/* Navigation */}
      <header className="border-b border-neutral-700 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold">⚡</span>
            </div>
            <span className="font-bold text-lg text-foreground">VigilDrive</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-neutral-300 hover:text-foreground transition">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <div className="inline-block mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <span className="text-sm font-semibold text-primary">AI-Powered Safety</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Real-Time Driver <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Monitoring</span>
            </h1>
            <p className="text-xl text-neutral-400 mb-8 leading-relaxed">
              Advanced AI-powered drowsiness detection system with real-time alerts, emergency response, and comprehensive analytics for fleet safety.
            </p>
            <div className="flex gap-4">
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:from-primary-dark hover:to-secondary-dark transition"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="px-6 py-3 border border-neutral-600 text-foreground font-semibold rounded-lg hover:border-neutral-500 transition"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Image/Animation */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-full h-96 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-neutral-700 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50"></div>
              <div className="text-center relative z-10">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-neutral-400 text-sm">Real-time monitoring dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-neutral-800/50 border-y border-neutral-700 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '👁️', name: 'Drowsiness Detection', desc: 'AI-powered real-time eye tracking' },
              { icon: '🚨', name: 'Instant Alerts', desc: 'Immediate notifications to fleet managers' },
              { icon: '📍', name: 'GPS Tracking', desc: 'Real-time location and route monitoring' },
              { icon: '📊', name: 'Analytics', desc: 'Comprehensive driver and fleet insights' },
              { icon: '🆘', name: 'Emergency Response', desc: 'Quick SOS system for emergencies' },
              { icon: '🔐', name: 'Enterprise Security', desc: 'End-to-end encrypted data protection' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-primary/30 transition">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.name}</h3>
                <p className="text-neutral-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 bg-gradient-to-r from-primary/20 to-secondary/20 border border-neutral-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Enhance Driver Safety?</h2>
          <p className="text-neutral-400 mb-8 text-lg">Join hundreds of fleet managers using VigilDrive</p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:from-primary-dark hover:to-secondary-dark transition"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-700 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-neutral-500 text-sm">
          <p>&copy; 2026 VigilDrive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
