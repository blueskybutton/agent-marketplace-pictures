'use client';

import type { CatalogItem } from '@/types';
import { ImageCard } from './ImageCard';

interface Props {
  items: CatalogItem[];
}

export function Gallery({ items }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <ImageCard item={item} />
        </div>
      ))}
    </div>
  );
}
