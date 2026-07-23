import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolveLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function LegacySeoRedirect(props: { params: Promise<{ lang: string; path: string[] }> }) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const oldPath = `/${params.path.join('/')}`;
  const rule = await prisma.seoRedirect.findFirst({ where: { oldPath, isActive: true } });
  if (!rule) notFound();

  await prisma.seoRedirect.update({ where: { id: rule.id }, data: { hits: { increment: 1 } } });
  const localizedTarget = /^\/(ar|en)(?:\/|$)/.test(rule.newPath)
    ? rule.newPath
    : `/${params.lang}${rule.newPath.startsWith('/') ? rule.newPath : `/${rule.newPath}`}`;

  if (rule.statusCode === 308 || rule.statusCode === 301) permanentRedirect(localizedTarget);
  redirect(localizedTarget);
}
