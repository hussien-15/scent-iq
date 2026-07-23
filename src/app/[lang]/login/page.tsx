'use client';

import { useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { getDictionary, resolveLocale } from '@/lib/i18n';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage(props: { params: Promise<{ lang: string }> }) {
  const rawParams = use(props.params);
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setAuthError('');

    const result = await signIn('credentials', {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(dict.login.error);
    } else {
      window.location.href = `/${params.lang}`;
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <p className="eyebrow mb-2">{dict.login.welcomeBack}</p>
      <h1 className="mb-8 font-display text-3xl text-parchment">{dict.login.signIn}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <input
            type="email"
            placeholder={dict.login.email}
            {...register('email')}
            className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-gold-bright">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder={dict.login.password}
            {...register('password')}
            className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-gold-bright">{errors.password.message}</p>
          )}
        </div>

        {authError && <p className="text-sm text-gold-bright">{authError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gold py-3 font-body text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
        >
          {isSubmitting ? dict.login.submitting : dict.login.submit}
        </button>
      </form>

      <p className="mt-6 text-xs text-smoke/70">{dict.login.note}</p>
    </div>
  );
}
