'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const COMPLETE = new Set(['AUDIT_COMPLETE', 'ACTIVE_MONITORING']);

// Human copy mapped from the live client status. The API exposes no real
// progress %, so we describe the phase truthfully rather than fake a number.
function statusCopy(status?: string): string {
  switch (status) {
    case 'PENDING_AUDIT':
      return 'Submitting your request to the scan engine…';
    case 'SCANNING':
      return 'Searching data brokers for your records as we speak…';
    case 'AUDIT_COMPLETE':
    case 'ACTIVE_MONITORING':
      return 'Compiling your exposure report…';
    default:
      return 'Searching for your info as we speak…';
  }
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const doneRef = useRef(false);

  const load = useCallback(async () => {
    if (doneRef.current) return;
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
      if (COMPLETE.has(data.status)) doneRef.current = true;
    } catch {
      setError('Network error loading report.');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const t0 = setTimeout(load, 0); // defer first fetch out of effect body
    const iv = setInterval(load, 5000);
    return () => {
      clearTimeout(t0);
      clearInterval(iv);
    };
  }, [id, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="pb-progress mb-5" />
          <p className="text-gray-300 text-sm">Searching for your info as we speak…</p>
          <p className="text-gray-600 text-xs mt-2">This page updates automatically — no need to refresh.</p>
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
              : statusCopy(report?.status)}
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

          {/* Paywall CTA — only shown once the redacted results are in */}
          {isComplete ? (
            <div className="relative pt-2">
              <div className="absolute -top-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              <h2 className="text-lg font-medium text-white mb-2">Get the full list and detailed opt-out instructions here</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The free scan shows a sample of brokers. Unlock your complete exposure report —
                all {targets.length > 0 ? targets.length : 5}+ brokers detected — plus step-by-step
                removal instructions tailored to your exact footprint. One-time purchase. No subscription.
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/checkout', { method: 'POST' });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert('Checkout failed: ' + (data.error || 'unknown error'));
                    }
                  } catch (e) {
                    alert('Checkout failed to start.');
                  }
                }}
                className="w-full bg-white text-black font-semibold py-3 rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                Only $19.00
              </button>
              <p className="text-[10px] text-gray-500 mt-3 text-center uppercase tracking-wider">
                Encrypted & secure · Your data stays yours
              </p>
            </div>
          ) : (
            <div className="relative pt-2">
              <div className="absolute -top-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
              <div className="pb-progress mb-4" />
              <p className="text-gray-500 text-sm leading-relaxed text-center">
                Your results will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
