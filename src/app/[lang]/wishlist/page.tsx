import WishlistPageClient from '@/components/WishlistPageClient';
import { getDictionary, resolveLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function WishlistPage(props: { params: Promise<{ lang: string }> }) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <p className="eyebrow mb-2">{dict.wishlist.eyebrow}</p>
        <h1 className="font-display text-4xl text-parchment">{dict.wishlist.title}</h1>
      </div>
      <WishlistPageClient lang={params.lang} dict={dict} />
    </div>
  );
}
