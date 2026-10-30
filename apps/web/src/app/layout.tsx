import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
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

export const metadata: Metadata = {
  title: PRODUCT.name,
  description: `${PRODUCT.name} — 1v1 trivia (sample version)`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0B2238', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="min-h-screen font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
