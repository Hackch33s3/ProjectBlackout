export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Non-Retention Framework</h1>
        <div className="space-y-6 text-slate-300 text-lg">
          <p>
            Project BLACKOUT operates on a strict non-retention framework. 
          </p>
          <p>
            When you submit a request, your Personally Identifiable Information (PII) is passed directly to our sovereign scraping engine via encrypted memory. 
          </p>
          <p>
            We do not sell your data. We do not train AI models on your data. We do not sell or share your data with third-party brokers. 
          </p>
          <p>
            The only data we persist is the minimal metadata required to execute the deletion protocols and generate your exposure report. Once the protocol is complete, the raw PII is flushed from our active execution context.
          </p>
          <p className="text-slate-500 text-sm mt-12">
            Last updated: June 28, 2026
          </p>
        </div>
      </div>
    </main>
  );
}