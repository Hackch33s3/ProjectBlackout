'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [pastCity, setPastCity] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = { fullName, pastCity, email };

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setError("You've already started a scan with this email — check your inbox for your report link.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.clientId) {
        throw new Error('API returned success but missing clientId');
      }

      router.push(`/report/${data.clientId}`);
    } catch (err) {
      console.error('Form submission failed:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] antialiased">
      {/* Top bar */}
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-6 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[0.18em] uppercase text-[#1A1A1A]">
          Project Blackout
        </span>
        <a href="/privacy" className="text-xs tracking-wide text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
          Privacy
        </a>
      </header>

      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-0 border-t border-[#E2E0DB]" />
      </div>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
        <p className="text-xs tracking-[0.22em] uppercase text-[#8A8A8A] mb-5">
          Data Broker Removal
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight text-[#1A1A1A] mb-5">
          See who is holding your personal data.
        </h1>
        <p className="text-base sm:text-lg text-[#6B6B6B] max-w-xl mx-auto leading-relaxed">
          We scan the major data brokers that index and trade your information,
          then give you a clear path to remove it.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-0 border-t border-[#E2E0DB]" />
      </div>

      {/* Form */}
      <section className="max-w-md mx-auto px-6 pt-12 pb-20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium tracking-wide text-[#6B6B6B] uppercase mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-3 bg-white border border-[#E2E0DB] rounded-md text-[#1A1A1A] placeholder:text-[#B5B2AB] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium tracking-wide text-[#6B6B6B] uppercase mb-1.5">
              Past City
            </label>
            <input
              type="text"
              placeholder="Toronto, ON"
              value={pastCity}
              onChange={(e) => setPastCity(e.target.value)}
              required
              className="w-full px-3.5 py-3 bg-white border border-[#E2E0DB] rounded-md text-[#1A1A1A] placeholder:text-[#B5B2AB] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium tracking-wide text-[#6B6B6B] uppercase mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-3 bg-white border border-[#E2E0DB] rounded-md text-[#1A1A1A] placeholder:text-[#B5B2AB] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-[#9A2B2B] leading-snug">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A1A] hover:bg-black text-white font-medium py-3.5 px-8 rounded-md text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scanning…' : 'Get My Free Exposure Report'}
          </button>

          <p className="text-xs text-[#8A8A8A] text-center leading-relaxed pt-1">
            Free scan covers 5 major brokers. Full report unlocks after purchase.
            We do not retain your data beyond what removal requires.
          </p>
        </form>
      </section>

      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-0 border-t border-[#E2E0DB]" />
      </div>

      {/* Footer note */}
      <footer className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-[#8A8A8A]">
        <span>© {new Date().getFullYear()} Project Blackout</span>
        <span className="tracking-wide">Privacy-first · No resale</span>
      </footer>
    </main>
  );
}
