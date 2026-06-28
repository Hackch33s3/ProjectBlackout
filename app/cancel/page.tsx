import Link from 'next/link';
export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-red-400">Checkout Canceled</h1>
        <p className="text-slate-300 mb-8">You were not charged. Your digital footprint remains exposed.</p>
       <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block">
          Return Home
        </Link>
      </div>
    </div>
  );
}