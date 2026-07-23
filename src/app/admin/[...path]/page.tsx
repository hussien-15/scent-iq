import { redirect } from 'next/navigation';
export default async function AdminAliasPage(props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  redirect(`/studio/${params.path.join('/')}`);
}
