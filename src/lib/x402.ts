import { verify as facilitatorVerify, settle as facilitatorSettle } from 'x402/verify';
import type { CatalogItem, Payment, PaymentRequirements } from '@/types';

const USDC: Record<string, string> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// USDC has 6 decimal places: $0.01 = 10_000 units
function priceUnits(usd: number): string {
  return Math.round(usd * 1_000_000).toString();
}

export type Network = 'base' | 'base-sepolia';

export function getNetwork(): Network {
  return process.env.NEXT_PUBLIC_NETWORK === 'base' ? 'base' : 'base-sepolia';
}

export function createPaymentRequirements(
  item: CatalogItem,
  resourceUrl: string,
): PaymentRequirements {
  const network = getNetwork();
  return {
    scheme: 'exact',
    network,
    maxAmountRequired: priceUnits(item.price),
    resource: resourceUrl,
    description: `Purchase: ${item.title} (${item.year})`,
    mimeType: item.mimeType,
    payTo: process.env.WALLET_ADDRESS ?? '0x0000000000000000000000000000000000000000',
    maxTimeoutSeconds: 300,
    asset: USDC[network],
    extra: {
      name: item.title,
      seller: 'Madalene',
      store: 'Van Gogh Vibes Pictures',
    },
  };
}

export function parsePayment(header: string): Payment {
  const json = Buffer.from(header, 'base64').toString('utf8');
  return JSON.parse(json) as Payment;
}

const DEMO_MODE =
  !process.env.WALLET_ADDRESS ||
  process.env.WALLET_ADDRESS === '0x0000000000000000000000000000000000000000';

export async function verifyAndSettle(
  payment: Payment,
  requirements: PaymentRequirements,
): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  if (DEMO_MODE) {
    console.warn('[x402] WALLET_ADDRESS not set — demo mode, skipping facilitator');
    return { ok: true };
  }

  // Cast to the x402 package's internal types — shape is identical
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = payment as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reqs = requirements as any;

  // Step 1: verify via Coinbase facilitator (signature + amount + recipient check)
  const verifyResult = await facilitatorVerify(payload, reqs);
  if (!verifyResult.isValid) {
    return { ok: false, error: verifyResult.invalidReason ?? 'invalid_payment' };
  }

  // Step 2: settle — facilitator calls transferWithAuthorization on-chain
  const settleResult = await facilitatorSettle(payload, reqs);
  if (!settleResult.success) {
    // Duplicate settlement means the buyer already paid (replay) — still serve the image
    if (settleResult.errorReason === 'duplicate_settlement') {
      return { ok: true, txHash: settleResult.transaction };
    }
    return { ok: false, error: settleResult.errorReason ?? 'settle_failed' };
  }

  return { ok: true, txHash: settleResult.transaction };
}
