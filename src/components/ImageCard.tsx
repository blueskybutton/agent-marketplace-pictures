'use client';

import { useState } from 'react';
import type { CatalogItem } from '@/types';
import { PaymentModal } from './PaymentModal';

interface Props {
  item: CatalogItem;
}

const VIBE_COLORS: Record<string, string> = {
  mystical: 'bg-purple-900/40 text-purple-300 border-purple-800/30',
  cosmic: 'bg-indigo-900/40 text-indigo-300 border-indigo-800/30',
  dreamy: 'bg-blue-900/40 text-blue-300 border-blue-800/30',
  joyful: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/30',
  vibrant: 'bg-orange-900/40 text-orange-300 border-orange-800/30',
  warm: 'bg-amber-900/40 text-amber-300 border-amber-800/30',
  serene: 'bg-teal-900/40 text-teal-300 border-teal-800/30',
  intimate: 'bg-rose-900/40 text-rose-300 border-rose-800/30',
  restful: 'bg-green-900/40 text-green-300 border-green-800/30',
  delicate: 'bg-pink-900/40 text-pink-300 border-pink-800/30',
  flowing: 'bg-cyan-900/40 text-cyan-300 border-cyan-800/30',
  natural: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/30',
  intense: 'bg-red-900/40 text-red-300 border-red-800/30',
  introspective: 'bg-violet-900/40 text-violet-300 border-violet-800/30',
  bold: 'bg-orange-900/40 text-orange-200 border-orange-800/30',
  romantic: 'bg-rose-900/40 text-rose-200 border-rose-800/30',
  luminous: 'bg-yellow-900/40 text-yellow-200 border-yellow-800/30',
  nostalgic: 'bg-amber-900/40 text-amber-200 border-amber-800/30',
  turbulent: 'bg-slate-800/40 text-slate-300 border-slate-700/30',
  melancholic: 'bg-blue-900/40 text-blue-200 border-blue-800/30',
  powerful: 'bg-gray-800/40 text-gray-300 border-gray-700/30',
  hopeful: 'bg-sky-900/40 text-sky-300 border-sky-800/30',
  ethereal: 'bg-purple-900/40 text-purple-200 border-purple-800/30',
};

// Gradient placeholders keyed by vibe[0]
const GRADIENTS: Record<string, string> = {
  mystical: 'from-indigo-950 via-purple-950 to-violet-950',
  joyful: 'from-amber-950 via-yellow-950 to-orange-950',
  serene: 'from-slate-950 via-teal-950 to-cyan-950',
  delicate: 'from-pink-950 via-rose-950 to-fuchsia-950',
  intense: 'from-red-950 via-rose-950 to-orange-950',
  romantic: 'from-rose-950 via-amber-950 to-yellow-950',
  turbulent: 'from-gray-950 via-slate-950 to-zinc-950',
  hopeful: 'from-sky-950 via-blue-950 to-indigo-950',
};

export function ImageCard({ item }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const purchased = blobUrl !== null;
  const gradient = GRADIENTS[item.vibe[0]] ?? 'from-stone-950 via-zinc-950 to-neutral-950';

  return (
    <>
      <article className="group bg-card border border-stroke rounded-2xl overflow-hidden hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 flex flex-col">
        {/* Image area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-canvas">
          {purchased ? (
            // Revealed image
            <img
              src={blobUrl!}
              alt={item.title}
              className="w-full h-full object-cover animate-reveal"
            />
          ) : (
            // Locked placeholder
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3`}>
              <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <LockIcon />
              </div>
              <p className="text-xs text-parchment-dim/60 uppercase tracking-widest font-medium">
                Hidden until purchased
              </p>
            </div>
          )}

          {/* Sold badge */}
          {purchased && (
            <div className="absolute top-3 right-3 bg-green-900/80 border border-green-700/40 text-green-300 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
              Acquired
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-serif text-parchment text-lg leading-tight">{item.title}</h3>
              <span className="text-parchment-dim/60 text-sm shrink-0 mt-0.5">{item.year}</span>
            </div>
            <p className="text-sm text-parchment/60 leading-relaxed line-clamp-3">{item.description}</p>
          </div>

          {/* Vibe tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.vibe.map((v) => (
              <span
                key={v}
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${VIBE_COLORS[v] ?? 'bg-stone-900/40 text-stone-300 border-stone-800/30'}`}
              >
                {v}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-gold font-semibold text-xl">${item.price.toFixed(2)}</span>
              <span className="text-parchment-dim text-xs">USDC</span>
            </div>

            {purchased ? (
              <a
                href={blobUrl!}
                download={`${item.id}.jpg`}
                className="text-xs text-gold/70 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                Download
              </a>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 hover:border-gold/50 text-sm font-medium px-4 py-1.5 rounded-xl transition-all duration-200 group-hover:bg-gold/15"
              >
                Buy
              </button>
            )}
          </div>
        </div>
      </article>

      {showModal && (
        <PaymentModal
          item={item}
          onSuccess={(url) => {
            setBlobUrl(url);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold/50">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
