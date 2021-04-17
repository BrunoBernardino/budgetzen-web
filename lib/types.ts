import { RxDatabase } from 'rxdb';

export interface PlainObject {
  [key: string]: any;
}

export type Currency = 'USD' | 'EUR' | 'GBP';

export interface AuthToken {
  syncToken: string;
  currency: Currency;
}

export interface Expense {
  id: string;
  cost: number;
  description: string;
  budget: string;
  date: string;
  _rev?: string;
}

export interface Budget {
  id: string;
  name: string;
  month: string;
  value: number;
  _rev?: string;
}

export interface PanelProps {
  currency: Currency;
  monthInView: string;
  budgets: Budget[];
  expenses: Expense[];
  reloadData: () => Promise<void>;
  db: RxDatabase;
}

// API
export interface ApiLoginRequest {
  syncToken: string;
  currency?: Currency;
}
export interface ApiLoginResponse {
  sessionCookieValue?: string;
  code?: number;
  message?: string;
}
