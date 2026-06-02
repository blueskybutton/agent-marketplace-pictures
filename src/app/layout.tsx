import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Van Gogh Vibes Pictures',
  description:
    'Rare and unique Van Gogh masterworks — purchase with $0.01 USDC on Base via the x402 micropayment protocol. Curated by Madalene.',
  keywords: ['van gogh', 'art', 'impressionism', 'digital art', 'usdc', 'base', 'x402', 'micropayments'],
  openGraph: {
    title: 'Van Gogh Vibes Pictures',
    description: 'Rare Van Gogh masterworks · $0.01 USDC each · x402 payments on Base',
    type: 'website',
  },
  other: {
    'x-payment-protocol': 'x402',
    'x-payment-network': 'base',
    'x-catalog-endpoint': '/api/catalog',
    'x-agent-card': '/.well-known/agent.json',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-canvas">
      <body className="min-h-screen bg-canvas text-parchment font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
