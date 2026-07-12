import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] antialiased">
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-6 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[0.18em] uppercase text-[#1A1A1A]">
          Project Blackout
        </span>
        <Link href="/" className="text-xs tracking-wide text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
          Home
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-0 border-t border-[#E2E0DB]" />
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-14 pb-20">
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Non-Retention Framework</h1>
        <div className="space-y-6 text-[#6B6B6B] text-base leading-relaxed">
          <p>
            Project Blackout operates on a strict non-retention framework.
          </p>
          <p>
            When you submit a request, your Personally Identifiable Information (PII) is passed
            directly to our sovereign scraping engine via encrypted memory.
          </p>
          <p>
            We do not sell your data. We do not train AI models on your data. We do not sell or
            share your data with third-party brokers.
          </p>
          <p>
            The only data we persist is the minimal metadata required to execute the deletion
            protocols and generate your exposure report. Once the protocol is complete, the raw
            PII is flushed from our active execution context.
          </p>
          <p className="text-[#8A8A8A] text-sm pt-8">
            Last updated: June 28, 2026
          </p>
        </div>
      </section>
    </main>
  );
}
