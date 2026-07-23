import InfoPage from '@/components/InfoPage';
import { getDictionary, type Locale } from '@/lib/i18n';

export default function TermsPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  return <InfoPage title={dict.info.terms.title} body={dict.info.terms.body} />;
}
