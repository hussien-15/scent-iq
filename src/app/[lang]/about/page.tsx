import InfoPage from '@/components/InfoPage';
import { getDictionary, type Locale } from '@/lib/i18n';

export default function AboutPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  return <InfoPage title={dict.info.about.title} body={dict.info.about.body} />;
}
