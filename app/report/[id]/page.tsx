'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ReportPage() {
  const { id } = useParams();
  const [status, setStatus] = useState('SCANNING');
  interface Target { broker_name: string; profile_url: string; status: string; };
  const [targets, setTargets] = useState<Target[]>([]);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      const res = await fetch(`/api/report/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName);
        setTargets(data.targets);
        setStatus(data.status);
      }
    };

    fetchReport();
    const interval = setInterval(fetchReport, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [id]);

  if (status === 'PENDING_AUDIT' || status === 'SCANNING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold mb-4">Hunting Your Digital Footprint...</h1>
          <p className="text-slate-400">Scanning 50+ data brokers for {fullName}. This takes about 60 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center text-red-500">We Found Your Data.</h1>
        <p className="text-center text-slate-400 mb-12">
          The following profiles were found publicly available. 
        </p>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-12">
          <div className="grid grid-cols-3 bg-slate-900/50 p-4 border-b border-slate-700 font-bold text-slate-300">
            <div>Broker</div>
            <div>Profile URL</div>
            <div className="text-right">Status</div>
          </div>
          {targets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No targets found in database yet. The engine is still running.</div>
          ) : (
            targets.map((target, idx) => (
              <div key={idx} className="grid grid-cols-3 p-4 border-b border-slate-700/50 last:border-0 items-center">
                <div className="font-medium">{target.broker_name}</div>
                <div className="text-blue-400 truncate text-sm">{target.profile_url}</div>
                <div className="text-right text-yellow-400 text-sm font-bold">EXPOSED</div>
              </div>
            ))
          )}
        </div>

        <div className="bg-gradient-to-r from-red-900/20 to-slate-800 border border-red-900/50 p-8 rounded-xl text-center">
          <h2 className="text-3xl font-bold mb-4">Erase These Profiles Now.</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            For <strong>$489 CAD</strong> we will approach these brokers, armed with the tools to and knowledge to force the removal of your data from their servers while you focus on the things that matter. 
            Includes <strong>$28 CAD/month</strong> continuous monitoring to ensure they don't reappear.
          </p>
          <a 
            href="/api/checkout" 
            className="inline-block bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-10 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            Initiate Full Erasure - $500 CAD
          </a>
          <p className="text-xs text-slate-500 mt-4">Secure checkout via Stripe. Cancel monitoring anytime.</p>
        </div>
      </div>
    </div>
  );
}