export interface CatalogItem {
  id: string;
  title: string;
  year: number;
  description: string;
  vibe: string[];
  price: number;
  mimeType: string;
}

export interface PaymentRequirements {
  scheme: 'exact';
  network: 'base' | 'base-sepolia';
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: {
    name: string;
    seller: string;
    store: string;
  };
}

export interface PaymentAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

// Matches x402 PaymentPayload spec (x402Version is required)
export interface Payment {
  x402Version: 1;
  scheme: 'exact';
  network: 'base' | 'base-sepolia';
  payload: {
    authorization: PaymentAuthorization;
    signature: string;
  };
}

export type PurchaseState = 'idle' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error';
