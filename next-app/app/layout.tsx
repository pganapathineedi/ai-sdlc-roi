import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI SDLC ROI Tool',
  description: 'Quantify the ROI of AI adoption across your Salesforce SDLC, grounded in your real org metrics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className + ' min-h-full bg-gray-50'}>{children}</body>
    </html>
  );
}
