import { type NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CATALOG, LOCAL_IMAGES } from '@/lib/catalog';
import { createPaymentRequirements, parsePayment, verifyAndSettle } from '@/lib/x402';
import { recordPurchase } from '@/lib/purchases';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const item = CATALOG.find((i) => i.id === params.id);
  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const paymentHeader = request.headers.get('X-PAYMENT');

  if (!paymentHeader) {
    const requirements = createPaymentRequirements(item, request.url);
    return Response.json(
      { x402Version: 1, error: 'X402', accepts: [requirements] },
      {
        status: 402,
        headers: {
          'X-PAYMENT-REQUIREMENTS': JSON.stringify(requirements),
          'Access-Control-Expose-Headers': 'X-PAYMENT-REQUIREMENTS',
        },
      },
    );
  }

  let payment;
  try {
    payment = parsePayment(paymentHeader);
  } catch {
    return Response.json({ error: 'Malformed X-PAYMENT header' }, { status: 400 });
  }

  const requirements = createPaymentRequirements(item, request.url);
  const result = await verifyAndSettle(payment, requirements);

  if (!result.ok) {
    return Response.json(
      { x402Version: 1, error: result.error ?? 'payment_failed' },
      { status: 402 },
    );
  }

  // Payment succeeded — log the sale (never let logging block delivery).
  try {
    await recordPurchase({
      id: item.id,
      title: item.title,
      priceUsd: item.price,
      buyer: payment?.payload?.authorization?.from ?? null,
      txHash: result.txHash ?? null,
      network: requirements.network,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[purchases] failed to record sale:', err);
  }

  const filename = LOCAL_IMAGES[params.id];
  if (!filename) {
    return Response.json({ error: 'Image not found' }, { status: 404 });
  }

  try {
    const imagePath = join(process.cwd(), 'private-images', filename);
    const buffer = readFileSync(imagePath);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': item.mimeType,
        'Cache-Control': 'no-store',
        ...(result.txHash ? { 'X-Settlement-Tx': result.txHash } : {}),
      },
    });
  } catch {
    return Response.json({ error: 'Image file not found on server' }, { status: 500 });
  }
}
