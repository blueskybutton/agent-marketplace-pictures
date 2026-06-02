import { listPurchases } from '@/lib/purchases';

export const dynamic = 'force-dynamic';

export async function GET() {
  const purchases = await listPurchases();
  return Response.json(
    { count: purchases.length, purchases },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
