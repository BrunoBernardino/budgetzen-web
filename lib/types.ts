import { SupportedCurrencySymbol } from '../public/ts/utils.ts';

export type EncryptedData = string;

export interface KeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

export interface User {
  id: string;
  email: string;
  encrypted_key_pair: EncryptedData;
  subscription: {
    external: {
      paypal?: {
        user_id: string;
        subscription_id: string;
      };
      stripe?: {
        user_id: string;
        subscription_id: string;
      };
    };
    isMonthly?: boolean;
    expires_at: string;
    updated_at: string;
  };
  status: 'trial' | 'active' | 'inactive';
  extra: {
    currency?: SupportedCurrencySymbol;
  };
  created_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  expires_at: Date;
  verified: boolean;
  last_seen_at: Date;
  created_at: Date;
}

export interface VerificationCode {
  id: string;
  user_id: string;
  code: string;
  verification: {
    type: 'session' | 'user-update' | 'data-delete' | 'user-delete';
    id: string;
  };
  expires_at: Date;
  created_at: Date;
}

export interface Budget {
  id: string;
  user_id: User['id'];
  name: EncryptedData;
  month: string;
  value: EncryptedData;
  extra: Record<never, never>; // NOTE: Here for potential future fields
}

export interface Expense {
  id: string;
  user_id: User['id'];
  cost: EncryptedData;
  description: EncryptedData;
  budget: EncryptedData;
  date: string;
  is_recurring: boolean;
  extra: Record<never, never>; // NOTE: Here for potential future fields
}
