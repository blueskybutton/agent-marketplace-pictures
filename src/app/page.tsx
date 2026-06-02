import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Gallery } from '@/components/Gallery';
import { CATALOG } from '@/lib/catalog';

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-stroke">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <PaletteIcon />
            </div>
            <div>
              <h1 className="text-parchment font-serif font-bold text-lg leading-none">
                Van Gogh Vibes
              </h1>
              <p className="text-parchment-dim/60 text-xs">by Madalene</p>
            </div>
          </div>
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stroke">
        {/* Background swirl decoration */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <path
              d="M-50 200 Q 100 50, 250 200 T 550 200 T 850 200"
              fill="none"
              stroke="#d4a017"
              strokeWidth="80"
            />
            <path
              d="M-50 280 Q 150 100, 350 280 T 750 280"
              fill="none"
              stroke="#d4a017"
              strokeWidth="40"
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            x402 Micropayments · $0.01 USDC per image
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-parchment leading-tight mb-4">
            Rare &amp; Unique<br />
            <span className="text-gold">Van Gogh</span> Masterworks
          </h2>
          <p className="text-parchment/50 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Each painting is a portal — a window into Van Gogh&apos;s singular vision.
            Connect your wallet and own a piece of art history for just one cent.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-parchment-dim/60">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Base Network
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              USDC Payments
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              x402 Protocol
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Agent Discoverable
            </span>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-serif text-2xl text-parchment">The Collection</h3>
            <p className="text-parchment-dim/60 text-sm mt-1">
              {CATALOG.length} works available · Each hidden until purchased
            </p>
          </div>
          <a
            href="/api/catalog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-parchment-dim/50 hover:text-gold border border-stroke hover:border-gold/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            API Catalog
          </a>
        </div>

        <Gallery items={CATALOG} />
      </main>

      {/* Footer */}
      <footer className="border-t border-stroke mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-serif text-parchment font-semibold">Van Gogh Vibes Pictures</p>
              <p className="text-parchment-dim/60 text-sm mt-1">Curated by Madalene</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-parchment-dim/50">
              <a href="/.well-known/agent.json" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                Agent Card
              </a>
              <a href="/api/catalog" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                Catalog API
              </a>
              <span>x402 Protocol</span>
              <span>USDC on Base</span>
            </div>
          </div>
          <p className="text-parchment-dim/30 text-xs mt-6">
            All artworks are public domain works by Vincent van Gogh (1853–1890).
          </p>
        </div>
      </footer>
    </div>
  );
}

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
