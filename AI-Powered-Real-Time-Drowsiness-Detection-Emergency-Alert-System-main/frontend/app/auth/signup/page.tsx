'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup', {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        company_name: formData.companyName,
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary mb-4">
            <span className="text-white font-bold text-xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">VigilDrive</h1>
          <p className="text-neutral-400">Create Your Account</p>
        </div>

        {/* Form Card */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Get Started</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Your Company"
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" required />
              I agree to the Terms of Service
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:from-primary-dark hover:to-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-700 pt-6">
            <p className="text-center text-sm text-neutral-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-secondary hover:text-secondary-dark transition font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
