import { CATALOG } from '@/lib/catalog';
import { getNetwork } from '@/lib/x402';

export async function GET() {
  const network = getNetwork();
  const data = {
    store: {
      name: 'Van Gogh Vibes Pictures',
      owner: 'Madalene',
      description: 'Rare and unique Van Gogh-style artworks — purchase with USDC on Base via x402.',
    },
    payment: {
      protocol: 'x402',
      network,
      asset: network === 'base'
        ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
        : '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
    items: CATALOG.map((item) => ({
      id: item.id,
      title: item.title,
      year: item.year,
      description: item.description,
      vibe: item.vibe,
      priceUsd: item.price,
      purchaseEndpoint: `/api/images/${item.id}`,
    })),
  };

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
