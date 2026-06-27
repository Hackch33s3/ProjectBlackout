'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [pastCity, setPastCity] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, pastCity, email }),
    });

    if (res.ok) {
      const data = await res.json();
      // Redirect to the live scan page (we will build this next)
      router.push(`/report/${data.clientId}`);
    } else {
      setLoading(false);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            See Exactly What Strangers Know About You.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8">
            Data brokers are selling your home address, phone number, and family members to anyone with $10. 
            Find out exactly what they have on you. Free. Instantly.
          </p>
          
          {/* Lead Capture Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 space-y-4 text-left">
            <input
              type="text"
              placeholder="Full Legal Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Past City (e.g., Toronto, ON)"
              value={pastCity}
              onChange={(e) => setPastCity(e.target.value)}
              required
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email Address (to send your report)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Scanning...' : 'Get My Free Exposure Report'}
            </button>
            <p className="text-xs text-slate-500 text-center">We do not store your data. We only destroy it.</p>
          </form>
        </div>
      </section>
    </main>
  );
}