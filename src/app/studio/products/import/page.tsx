import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductImportManager from '@/components/studio/ProductImportManager';

export default function ProductImportPage() {
  return <div className="space-y-6"><div><Link href="/studio/products" className="mb-4 inline-flex items-center gap-1 text-xs text-smoke hover:text-parchment"><ArrowLeft size={14} />Back to products</Link><p className="eyebrow mb-2">Catalog onboarding</p><h1 className="font-display text-3xl text-parchment">Product Import</h1><p className="mt-2 text-xs text-smoke">Prepare and review the first 100 real products without editing code.</p></div><ProductImportManager /></div>;
}
