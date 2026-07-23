import { redirect } from 'next/navigation';
export default function AdminAliasPage({ params }: { params: { path: string[] } }) { redirect(`/studio/${params.path.join('/')}`); }
