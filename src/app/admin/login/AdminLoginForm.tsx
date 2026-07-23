'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function AdminLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn('credentials', {
        email: String(form.get('email') ?? ''), password: String(form.get('password') ?? ''),
        adminScope: 'true', redirect: false,
      });
      if (!result?.ok || result.error) {
        setError('The email or password is incorrect, the account is unavailable, or too many attempts were made.');
        return;
      }
      window.location.assign(callbackUrl.startsWith('/studio') ? callbackUrl : '/studio');
    } catch {
      setError('Sign in could not be completed. Please try again safely.');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
      <label className="block"><span className="mb-2 block text-xs text-smoke">Admin email</span><input name="email" type="email" autoComplete="username" required maxLength={254} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-parchment outline-none transition focus:border-gold/60" placeholder="admin@scentiq.com" /></label>
      <label className="block"><span className="mb-2 block text-xs text-smoke">Password</span><span className="relative block"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={128} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 pe-12 text-sm text-parchment outline-none transition focus:border-gold/60" placeholder="••••••••••••" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute end-3 top-1/2 -translate-y-1/2 text-smoke hover:text-parchment" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
      {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-200">{error}</p>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-bright disabled:cursor-wait disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <LockKeyhole size={17} />}{loading ? 'Verifying securely…' : 'Sign in to Perfume Studio'}</button>
      <div className="flex items-center justify-between gap-4 text-[11px] text-smoke"><span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-gold" />Protected admin access</span><span title="Automated reset delivery is disabled until a trusted email provider is configured.">Forgot password? Contact Super Admin</span></div>
    </form>
  );
}
