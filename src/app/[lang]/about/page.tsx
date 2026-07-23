import InfoPage from '@/components/InfoPage';
import { getDictionary, resolveLocale } from '@/lib/i18n';

export default async function AboutPage(props: { params: Promise<{ lang: string }> }) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);
  return <InfoPage title={dict.info.about.title} body={dict.info.about.body} />;
}
