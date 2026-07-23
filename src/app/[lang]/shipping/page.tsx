import InfoPage from '@/components/InfoPage';
import { getDictionary, type Locale } from '@/lib/i18n';

export default function ShippingPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  return <InfoPage title={dict.info.shipping.title} body={dict.info.shipping.body} />;
}
