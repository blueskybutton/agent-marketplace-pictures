import type { Purchase } from '@/types';

// Purchase log.
//
// Persistence strategy:
//   - If Vercel KV (Upstash) is configured (KV_REST_API_URL + KV_REST_API_TOKEN),
//     sales are stored durably and shared across all serverless instances.
//   - Otherwise we fall back to an in-memory list. This works for local dev and
//     demos, but resets on cold starts and is NOT shared across instances.
//
// To make sales permanent in production: add the Vercel KV integration to the
// project (Storage tab) — no code change required, the env vars wire it up.

const MAX = 100;
const KV_KEY = 'vgv:purchases';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const kvEnabled = Boolean(KV_URL && KV_TOKEN);

// In-memory fallback (per-instance, ephemeral).
const memory: Purchase[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function kv(command: unknown[]): Promise<any> {
  const res = await fetch(KV_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  const json = await res.json();
  return json.result;
}

export async function recordPurchase(p: Purchase): Promise<void> {
  if (kvEnabled) {
    try {
      await kv(['LPUSH', KV_KEY, JSON.stringify(p)]);
      await kv(['LTRIM', KV_KEY, '0', String(MAX - 1)]);
      return;
    } catch (err) {
      console.error('[purchases] KV write failed, falling back to memory:', err);
    }
  }
  memory.unshift(p);
  if (memory.length > MAX) memory.length = MAX;
}

export async function listPurchases(): Promise<Purchase[]> {
  if (kvEnabled) {
    try {
      const raw = (await kv(['LRANGE', KV_KEY, '0', String(MAX - 1)])) as string[];
      return raw.map((s) => JSON.parse(s) as Purchase);
    } catch (err) {
      console.error('[purchases] KV read failed, falling back to memory:', err);
    }
  }
  return memory;
}
