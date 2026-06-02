'use client';

import { useState, useCallback } from 'react';
import { useAccount, useSignTypedData, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';
import type { CatalogItem, PaymentRequirements, PurchaseState } from '@/types';

const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? 'base-sepolia') as 'base' | 'base-sepolia';
const TARGET_CHAIN = NETWORK === 'base' ? base : baseSepolia;

const USDC_META = {
  base: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', name: 'USD Coin', version: '2' },
  'base-sepolia': { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', name: 'USD Coin', version: '2' },
};

interface Props {
  item: CatalogItem;
  onSuccess: (blobUrl: string) => void;
  onClose: () => void;
}

export function PaymentModal({ item, onSuccess, onClose }: Props) {
  const [state, setState] = useState<PurchaseState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();

  const wrongChain = isConnected && chainId !== TARGET_CHAIN.id;

  const handlePurchase = useCallback(async () => {
    if (!address) return;
    setError(null);

    try {
      if (wrongChain) {
        setState('connecting');
        await switchChainAsync({ chainId: TARGET_CHAIN.id });
      }

      setState('signing');

      // Step 1: Get payment requirements
      const res = await fetch(`/api/images/${item.id}`);
      if (res.ok) {
        // Demo mode: wallet not configured, image served directly
        const blob = await res.blob();
        onSuccess(URL.createObjectURL(blob));
        setState('success');
        return;
      }
      if (res.status !== 402) throw new Error('Unexpected server response');

      // x402 response: { x402Version, error, accepts: [PaymentRequirements] }
      const body = await res.json();
      const paymentRequirements: PaymentRequirements =
        body.accepts?.[0] ?? body.paymentRequirements;

      // Step 2: Build and sign EIP-3009 transferWithAuthorization
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);
      const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
      const nonce = ('0x' + Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

      const usdcMeta = USDC_META[NETWORK];
      const authorization = {
        from: address as `0x${string}`,
        to: paymentRequirements.payTo as `0x${string}`,
        value: BigInt(paymentRequirements.maxAmountRequired),
        validAfter: BigInt(0),
        validBefore,
        nonce,
      };

      const signature = await signTypedDataAsync({
        domain: {
          name: usdcMeta.name,
          version: usdcMeta.version,
          chainId: TARGET_CHAIN.id,
          verifyingContract: usdcMeta.address as `0x${string}`,
        },
        types: {
          TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
          ],
        },
        primaryType: 'TransferWithAuthorization',
        message: authorization,
      });

      // Step 3: Encode payment proof and fetch image
      setState('verifying');
      const payment = {
        x402Version: 1 as const,
        scheme: 'exact',
        network: NETWORK,
        payload: {
          authorization: {
            from: address,
            to: paymentRequirements.payTo,
            value: paymentRequirements.maxAmountRequired,
            validAfter: '0',
            validBefore: validBefore.toString(),
            nonce,
          },
          signature,
        },
      };

      const paymentHeader = btoa(JSON.stringify(payment));
      const imageRes = await fetch(`/api/images/${item.id}`, {
        headers: { 'X-PAYMENT': paymentHeader },
      });

      if (!imageRes.ok) {
        const body = await imageRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Payment failed');
      }

      const blob = await imageRes.blob();
      onSuccess(URL.createObjectURL(blob));
      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Signature rejected.');
      } else {
        setError(msg);
      }
      setState('error');
    }
  }, [address, item.id, onSuccess, signTypedDataAsync, switchChainAsync, wrongChain]);

  const vibeColors: Record<string, string> = {
    mystical: 'bg-purple-900/40 text-purple-300',
    cosmic: 'bg-indigo-900/40 text-indigo-300',
    dreamy: 'bg-blue-900/40 text-blue-300',
    joyful: 'bg-yellow-900/40 text-yellow-300',
    vibrant: 'bg-orange-900/40 text-orange-300',
    warm: 'bg-amber-900/40 text-amber-300',
    serene: 'bg-teal-900/40 text-teal-300',
    intimate: 'bg-rose-900/40 text-rose-300',
    restful: 'bg-green-900/40 text-green-300',
    delicate: 'bg-pink-900/40 text-pink-300',
    flowing: 'bg-cyan-900/40 text-cyan-300',
    natural: 'bg-emerald-900/40 text-emerald-300',
    intense: 'bg-red-900/40 text-red-300',
    introspective: 'bg-violet-900/40 text-violet-300',
    bold: 'bg-orange-900/40 text-orange-300',
    romantic: 'bg-rose-900/40 text-rose-300',
    luminous: 'bg-yellow-900/40 text-yellow-200',
    nostalgic: 'bg-amber-900/40 text-amber-200',
    turbulent: 'bg-slate-900/40 text-slate-300',
    melancholic: 'bg-blue-900/40 text-blue-200',
    powerful: 'bg-gray-900/40 text-gray-300',
    hopeful: 'bg-sky-900/40 text-sky-300',
    ethereal: 'bg-purple-900/40 text-purple-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-stroke rounded-2xl p-6 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-parchment-dim uppercase tracking-widest mb-1">Acquire Artwork</p>
            <h2 className="text-xl font-serif text-parchment">{item.title}</h2>
            <p className="text-sm text-parchment-dim">{item.year}</p>
          </div>
          <button
            onClick={onClose}
            className="text-parchment-dim hover:text-parchment transition-colors text-xl leading-none ml-4"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-parchment/70 mb-4 leading-relaxed">{item.description}</p>

        {/* Vibe tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {item.vibe.map((v) => (
            <span
              key={v}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${vibeColors[v] ?? 'bg-stone-900/40 text-stone-300'}`}
            >
              {v}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between bg-canvas/60 rounded-xl px-4 py-3 mb-5 border border-stroke">
          <span className="text-sm text-parchment-dim">Price</span>
          <div className="text-right">
            <span className="text-gold font-semibold text-lg">$0.01</span>
            <span className="text-parchment-dim text-xs ml-1">USDC</span>
          </div>
        </div>

        {/* Network badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-parchment-dim">
            {NETWORK === 'base' ? 'Base Mainnet' : 'Base Sepolia (Testnet)'}
          </span>
        </div>

        {/* Action area */}
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-parchment-dim text-center">Connect your wallet to purchase</p>
            <ConnectButton />
          </div>
        ) : wrongChain ? (
          <button
            onClick={handlePurchase}
            className="w-full bg-gold hover:bg-gold-light text-canvas font-semibold py-3 rounded-xl transition-colors"
          >
            Switch to {NETWORK === 'base' ? 'Base' : 'Base Sepolia'}
          </button>
        ) : state === 'idle' || state === 'error' ? (
          <div className="flex flex-col gap-3">
            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2 border border-red-900/40">
                {error}
              </p>
            )}
            <button
              onClick={handlePurchase}
              className="w-full bg-gold hover:bg-gold-light text-canvas font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Purchase for $0.01 USDC</span>
            </button>
          </div>
        ) : state === 'signing' ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-gold">
              <Spinner />
              <span className="text-sm">Sign in your wallet (no gas required)</span>
            </div>
          </div>
        ) : state === 'verifying' ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-parchment-dim">
              <Spinner />
              <span className="text-sm">Verifying payment…</span>
            </div>
          </div>
        ) : state === 'connecting' ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-parchment-dim">
              <Spinner />
              <span className="text-sm">Switching network…</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <span className="text-2xl">✓</span>
              <span className="text-sm font-medium">Payment accepted — enjoy your art!</span>
            </div>
          </div>
        )}

        <p className="text-xs text-parchment-dim/50 text-center mt-4">
          Powered by x402 · USDC on Base
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
