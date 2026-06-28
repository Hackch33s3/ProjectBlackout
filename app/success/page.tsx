'use client';

import { useState,  } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OnboardForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('idle');
  const [fullName, setFullName] = useState('');
  const [pastCity, setPastCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');

    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, fullName, pastCity }),
    });

    if (res.ok) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-4">You are now off the grid.</h1>
          <p className="text-slate-300">The engine is hunting. Check your email for updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl border border-slate-700">
        <h1 className="text-3xl font-bold mb-6 text-center">Final Step: Target Identification</h1>
        <p className="text-slate-400 mb-6 text-center text-sm">
          We need your exact legal name and a city you've lived in to find your data broker profiles.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            type="submit"
            disabled={status === 'processing'}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {status === 'processing' ? 'Initiating Erasure...' : 'Start Erasure'}
          </button>
          {status === 'error' && <p className="text-red-500 text-center text-sm">Failed to initialize. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>}>
      <OnboardForm />
    </Suspense>
  );
}