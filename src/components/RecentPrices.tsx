'use client';

import { useEffect, useState } from 'react';
import type { Purchase } from '@/types';

// Compact inline display of recent purchase prices — no separate section.
export function RecentPrices() {
  const [prices, setPrices] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/purchases', { cache: 'no-store' });
        const data = await res.json();
        if (active) setPrices((data.purchases ?? []).map((p: Purchase) => p.priceUsd));
      } catch {
        /* keep last good data */
      }
    }
    load();
    const t = setInterval(load, 15_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (prices.length === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-parchment-dim/50 mt-2">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span>Recently purchased:</span>
      {prices.slice(0, 10).map((price, i) => (
        <span
          key={i}
          className="text-gold/80 border border-gold/20 rounded px-1.5 py-0.5"
        >
          ${price.toFixed(2)}
        </span>
      ))}
    </p>
  );
}
