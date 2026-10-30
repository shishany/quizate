import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PRODUCT, dirOf } from '@quizate/shared';
import { DICTIONARIES, getLocale } from '@/i18n';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = DICTIONARIES[await getLocale()];
  return { title: `${t.meta.title} · ${PRODUCT.name}` };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
