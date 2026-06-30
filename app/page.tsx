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

    const payload = { fullName, pastCity, email };

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
// ... rest of the function remains the same

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!data.clientId) {
        throw new Error('API returned success but missing clientId');
      }

      router.push(`/report/${data.clientId}`);
    } catch (error) {
      console.error('Form submission failed:', error);
      setLoading(false);
      alert('Something went wrong. Check browser console for details.');
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
            <p className="text-xs text-slate-500 text-center">
              User data is handled under our strict non-retention framework. See how it works <a href="/privacy" className="text-blue-400 hover:underline">HERE</a>.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}