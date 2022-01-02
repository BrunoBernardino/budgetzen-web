import * as Etebase from 'etebase';

export interface PlainObject {
  [key: string]: any;
}

export type Currency = 'USD' | 'EUR' | 'GBP';

export type Theme = 'dark' | 'light';

export interface AuthToken {
  session: string;
  currency: Currency;
  theme?: Theme;
}

export interface ExpenseContent {
  cost: number;
  description: string;
  budget: string;
  date: string;
}

export interface Expense extends ExpenseContent {
  id: string;
}

export interface BudgetContent {
  name: string;
  month: string;
  value: number;
}

export interface Budget extends BudgetContent {
  id: string;
}

export interface PanelProps {
  currency: Currency;
  monthInView: string;
  budgets: Budget[];
  expenses: Expense[];
  reloadData: () => Promise<void>;
  etebase: Etebase.Account;
}
