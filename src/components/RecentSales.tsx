'use client';

import { useEffect, useState } from 'react';
import type { Purchase } from '@/types';

function shortAddr(a: string | null): string {
  if (!a) return 'Anonymous collector';
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function explorerUrl(p: Purchase): string | null {
  if (!p.txHash) return null;
  const host = p.network === 'base' ? 'basescan.org' : 'sepolia.basescan.org';
  return `https://${host}/tx/${p.txHash}`;
}

export function RecentSales() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/purchases', { cache: 'no-store' });
        const data = await res.json();
        if (active) setPurchases(data.purchases ?? []);
      } catch {
        /* keep last good data */
      } finally {
        if (active) setLoaded(true);
      }
    }
    load();
    const t = setInterval(load, 15_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  return (
    <section id="sales" className="border-t border-stroke bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl text-parchment">Recent Sales</h3>
            <p className="text-parchment-dim/60 text-sm mt-1">
              {!loaded
                ? 'Loading…'
                : purchases.length > 0
                ? `${purchases.length} purchase${purchases.length === 1 ? '' : 's'} so far`
                : 'No purchases yet — your first sale will appear here'}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-parchment-dim/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="border border-dashed border-stroke rounded-xl py-12 text-center">
            <p className="text-parchment-dim/40 text-sm">
              When a collector buys a painting, it appears here in real time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stroke border border-stroke rounded-xl overflow-hidden">
            {purchases.map((p, i) => {
              const tx = explorerUrl(p);
              return (
                <li
                  key={`${p.txHash ?? p.id}-${p.at}-${i}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 bg-card/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                      <span className="text-gold text-xs">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-parchment text-sm font-medium truncate">{p.title}</p>
                      <p className="text-parchment-dim/50 text-xs truncate">
                        {shortAddr(p.buyer)} · {timeAgo(p.at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gold text-sm font-medium">${p.priceUsd.toFixed(2)}</p>
                    {tx ? (
                      <a
                        href={tx}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-parchment-dim/40 hover:text-gold text-xs transition-colors"
                      >
                        View tx ↗
                      </a>
                    ) : (
                      <span className="text-parchment-dim/30 text-xs">demo</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
