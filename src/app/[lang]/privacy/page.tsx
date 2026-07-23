import InfoPage from '@/components/InfoPage';
import { getDictionary, type Locale } from '@/lib/i18n';

export default function PrivacyPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  return <InfoPage title={dict.info.privacy.title} body={dict.info.privacy.body} />;
}
