export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Your Digital Footprint, Erased.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8">
            We hunt down every data broker holding your information and force them to delete it. 
            Automatically. Continuously. Relentlessly.
          </p>
          
          {/* CTA Button */}
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg">
            Start Monitoring - $29/month
          </button>
          
          <p className="text-sm text-slate-400 mt-4">
            Cancel anytime. 30-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-3">Automated Scanning</h3>
            <p className="text-slate-300">
              Our engine scans 50+ data brokers daily, finding every profile containing your personal information.
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-3">Instant Opt-Out</h3>
            <p className="text-slate-300">
              We automatically submit legal removal requests to every broker. No waiting. No hassle.
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-2xl font-bold mb-3">Continuous Monitoring</h3>
            <p className="text-slate-300">
              New brokers appear daily. We monitor continuously and remove you from new threats automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by Privacy-Conscious Individuals</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/30 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-slate-300">Profiles Removed</div>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-lg">
              <div className="text-3xl font-bold text-purple-400 mb-2">50+</div>
              <div className="text-slate-300">Brokers Monitored</div>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-slate-300">Active Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm p-12 rounded-2xl border border-slate-700">
          <h2 className="text-3xl font-bold mb-4">Ready to Disappear?</h2>
          <p className="text-slate-300 mb-8">
            Join hundreds of others who have taken control of their digital privacy.
          </p>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-slate-400 text-sm">
        <p>© 2026 Project BLACKOUT. All rights reserved.</p>
      </footer>
    </main>
  );
}