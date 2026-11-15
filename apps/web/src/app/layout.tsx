import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic, Noto_Nastaliq_Urdu } from 'next/font/google';
import type { ReactNode } from 'react';
import { PRODUCT } from '@quizate/shared';
import { StoreProvider } from '@/lib/store';
import './globals.css';

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
});

/** Urdu is set in Nastaliq with more line height (FR-29, NFR-10). */
const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
  display: 'swap',
});

export const metadata: Metadata = {
  title: PRODUCT.name,
  description: `${PRODUCT.name} (${PRODUCT.nameAr}) — Knowledge rewarded, competition ignited`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0C5A62', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${nastaliq.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
