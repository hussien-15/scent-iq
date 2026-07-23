import { ShieldCheck } from 'lucide-react';
import AdminLoginForm from './AdminLoginForm';

export default function AdminLoginPage({ searchParams }: { searchParams: { callbackUrl?: string; reason?: string } }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(200,154,62,0.18),transparent_38%),linear-gradient(145deg,#15120d,#070707_60%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-gold/20 bg-ink-soft/90 p-7 shadow-2xl backdrop-blur md:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] text-gold-bright"><ShieldCheck size={24} /></div>
        <div className="mt-5 text-center"><p className="font-display text-2xl text-parchment">Scent<span className="text-gold">IQ</span></p><p className="mt-1 text-xs uppercase tracking-[0.24em] text-smoke">Perfume Studio</p></div>
        <div className="mt-8"><h1 className="font-display text-3xl text-parchment">Secure admin sign in</h1><p className="mt-2 text-sm leading-6 text-smoke">Access products, orders, inventory, analytics and store settings.</p></div>
        {searchParams.reason === 'session' && <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs text-amber-100">Your admin session changed. Sign in again to continue.</p>}
        {searchParams.reason === 'idle' && <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs text-amber-100">You were signed out after 30 minutes of inactivity.</p>}
        <AdminLoginForm callbackUrl={searchParams.callbackUrl ?? '/studio'} />
      </section>
    </main>
  );
}
