'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

type Target = {
  broker_name: string;
  profile_url: string;
  status: string;
};

type Report = {
  status: string;
  fullName?: string;
  targets: Target[];
};

// Redact the personal profile link: keep the broker domain, drop the
// path that points at the individual's record. PII never rendered.
function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[2]?.replace(/^www\./, '') || 'broker site';
  }
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/report/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) setError('Report not found.');
        else setError('Failed to load report.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReport(data);
      setLoading(false);
      // Keep polling while the scan is still running.
      if (data.status !== 'AUDIT_COMPLETE' && data.status !== 'ACTIVE_MONITORING') {
        setPolling(true);
      } else {
        setPolling(false);
      }
    } catch {
      setError('Network error loading report.');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
    const t = setInterval(() => {
      setPolling((p) => {
        if (p) load();
        return p;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [id, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-gray-600 border-t-gray-200 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Scanning data brokers…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111] border border-gray-800 rounded-xl p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const targets = report?.targets || [];
  const isComplete = report?.status === 'AUDIT_COMPLETE' || report?.status === 'ACTIVE_MONITORING';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-[#111] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8 border-b border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Project Blackout</span>
            <span className="text-[10px] font-mono text-gray-600">REF: {id.slice(0, 8).toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            {isComplete ? 'Scan Complete' : 'Scan in progress…'}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isComplete
              ? 'We mapped your digital footprint across major data brokers. Your information is currently exposed, indexed, and being traded.'
              : 'We are searching data brokers for your records. This page updates automatically — no need to refresh.'}
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Redacted broker list — shows WHO has you, never the link to your record */}
          <div>
            <h2 className="text-lg font-medium text-white mb-3">
              {isComplete ? 'Brokers found holding your data' : 'Brokers detected so far'}
            </h2>
            {targets.length === 0 ? (
              <p className="text-gray-500 text-sm">No exposures detected yet.</p>
            ) : (
              <ul className="space-y-2">
                {targets.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-3"
                  >
                    <span className="text-sm text-gray-200">{t.broker_name}</span>
                    <span className="text-[10px] font-mono text-gray-600">{redactUrl(t.profile_url)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Paywall CTA */}
          <div className="relative pt-2">
            <div className="absolute -top-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            <h2 className="text-lg font-medium text-white mb-2">Get the full list and detailed opt-out instructions here</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              The free scan shows a sample of brokers. Unlock your complete exposure report —
              all {targets.length > 0 ? targets.length : 5}+ brokers detected — plus step-by-step
              removal instructions tailored to your exact footprint. One-time purchase. No subscription.
            </p>
            <button
              onClick={() => { window.location.href = '/api/checkout'; }}
              className="w-full bg-white text-black font-semibold py-3 rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center"
            >
              Only $19.00
            </button>
            <p className="text-[10px] text-gray-500 mt-3 text-center uppercase tracking-wider">
              Encrypted & secure · Your data stays yours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
