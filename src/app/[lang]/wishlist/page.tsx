import WishlistPageClient from '@/components/WishlistPageClient';
import { getDictionary, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default function WishlistPage({ params }: { params: { lang: Locale } }) {
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
