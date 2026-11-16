export type TransactionType = 'income' | 'expense';

/** A single money movement. `date` is stored as an ISO date string (yyyy-MM-dd). */
export interface Transaction {
  id: string;
  type: TransactionType;
  /** Always a positive number; the sign comes from `type`. */
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  /** Unix epoch ms, used to keep a stable order for same-day entries. */
  createdAt: number;
}

/** Payload for creating / updating a transaction (no id, no createdAt). */
export interface NewTransaction {
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
}

/** A transaction with its category resolved, ready for display. */
export interface TransactionView extends Transaction {
  categoryName: string;
  categoryColor: string;
}
