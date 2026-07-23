import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin sign in | ScentIQ',
  description: 'Secure access to ScentIQ Perfume Studio.',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" dir="ltr"><body className="min-h-screen bg-ink text-parchment">{children}</body></html>;
}
