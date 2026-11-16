import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';
import {
  NewTransaction,
  Transaction,
  TransactionView,
} from '../models/transaction.model';
import { CategoryService } from './category.service';
import { StorageService } from './storage.service';
import { buildSeedTransactions } from './seed-data';
import { generateId } from '../utils/common.utils';
import { monthKeyToLabel, toMonthKey } from '../utils/date.utils';

export interface MonthTotals {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  /** Share of the month's total expense, 0..1. */
  share: number;
}

export interface MonthSummary {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface MonthOption {
  key: string;
  label: string;
}

const TRANSACTIONS_KEY = 'expense-tracker.transactions.v1';
const SEEDED_KEY = 'expense-tracker.seeded.v1';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidTransaction(item: unknown): item is Transaction {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  const t = item as Transaction;
  return (
    typeof t.id === 'string' &&
    (t.type === 'income' || t.type === 'expense') &&
    typeof t.amount === 'number' &&
    Number.isFinite(t.amount) &&
    t.amount > 0 &&
    typeof t.categoryId === 'string' &&
    typeof t.date === 'string' &&
    DATE_PATTERN.test(t.date) &&
    typeof t.note === 'string'
  );
}

function byDateDesc(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return b.createdAt - a.createdAt;
}

/**
 * Single source of truth for transactions.
 * State lives in a BehaviorSubject; every write persists to localStorage.
 * All derived data (monthly totals, category breakdowns, summaries) is
 * computed with RxJS operators from the one stream — no duplicated state.
 */
@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly storage = inject(StorageService);
  private readonly categoryService = inject(CategoryService);

  private readonly transactionsSubject = new BehaviorSubject<Transaction[]>(this.load());
  readonly transactions$ = this.transactionsSubject.asObservable();

  /** Transactions with category name/colour resolved, newest first. */
  readonly enriched$: Observable<TransactionView[]> = combineLatest([
    this.transactions$,
    this.categoryService.categories$,
  ]).pipe(
    map(([transactions, categories]) => {
      const byId = new Map(categories.map((c) => [c.id, c]));
      return transactions.map((t) => {
        const category = byId.get(t.categoryId);
        return {
          ...t,
          categoryName: category?.name ?? 'Unknown category',
          categoryColor: category?.color ?? '#64748b',
        };
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // ----- CRUD -----

  add(data: NewTransaction): Transaction {
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    this.persist([...this.transactionsSubject.value, transaction]);
    return transaction;
  }

  update(id: string, data: NewTransaction): void {
    this.persist(
      this.transactionsSubject.value.map((t) =>
        t.id === id ? { ...t, ...data } : t,
      ),
    );
  }

  delete(id: string): void {
    this.persist(this.transactionsSubject.value.filter((t) => t.id !== id));
  }

  getById(id: string): Transaction | undefined {
    return this.transactionsSubject.value.find((t) => t.id === id);
  }

  // ----- Derived streams -----

  /** Income / expense / balance for one month ('yyyy-MM'). */
  monthTotals(monthKey: string): Observable<MonthTotals> {
    return this.transactions$.pipe(
      map((transactions) => this.totalsFor(transactions, monthKey)),
    );
  }

  /** Spending per category for one month, largest first. */
  categoryBreakdown(monthKey: string): Observable<CategoryBreakdown[]> {
    return combineLatest([this.transactions$, this.categoryService.categories$]).pipe(
      map(([transactions, categories]) => {
        const totals = new Map<string, number>();
        let expenseTotal = 0;
        for (const t of transactions) {
          if (t.type === 'expense' && toMonthKey(t.date) === monthKey) {
            totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
            expenseTotal += t.amount;
          }
        }
        const byId = new Map(categories.map((c) => [c.id, c]));
        return [...totals.entries()]
          .map(([categoryId, total]) => {
            const category = byId.get(categoryId);
            return {
              categoryId,
              name: category?.name ?? 'Unknown category',
              color: category?.color ?? '#64748b',
              total,
              share: expenseTotal > 0 ? total / expenseTotal : 0,
            };
          })
          .sort((a, b) => b.total - a.total);
      }),
    );
  }

  /** Most recent transactions, newest first. */
  recent(count: number): Observable<TransactionView[]> {
    return this.enriched$.pipe(map((txs) => [...txs].sort(byDateDesc).slice(0, count)));
  }

  /** Months that contain data, newest first, for filter dropdowns. */
  availableMonths(): Observable<MonthOption[]> {
    return this.transactions$.pipe(
      map((transactions) => {
        const keys = [...new Set(transactions.map((t) => toMonthKey(t.date)))].sort().reverse();
        return keys.map((key) => ({ key, label: monthKeyToLabel(key) }));
      }),
    );
  }

  /** One summary row per month, newest first. */
  monthlySummaries(): Observable<MonthSummary[]> {
    return this.transactions$.pipe(
      map((transactions) => {
        const grouped = new Map<string, MonthSummary>();
        for (const t of transactions) {
          const key = toMonthKey(t.date);
          const row = grouped.get(key) ?? {
            monthKey: key,
            label: monthKeyToLabel(key),
            income: 0,
            expense: 0,
            balance: 0,
            count: 0,
          };
          if (t.type === 'income') {
            row.income += t.amount;
          } else {
            row.expense += t.amount;
          }
          row.count += 1;
          grouped.set(key, row);
        }
        return [...grouped.values()]
          .map((row) => ({ ...row, balance: row.income - row.expense }))
          .sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
      }),
    );
  }

  // ----- Internals -----

  private totalsFor(transactions: Transaction[], monthKey: string): MonthTotals {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (toMonthKey(t.date) !== monthKey) {
        continue;
      }
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    return { income, expense, balance: income - expense };
  }

  private load(): Transaction[] {
    const stored = this.storage.read<unknown>(TRANSACTIONS_KEY, null);
    const alreadySeeded = this.storage.read<boolean>(SEEDED_KEY, false);

    if (Array.isArray(stored)) {
      const valid = stored.filter(isValidTransaction);
      if (valid.length > 0 || alreadySeeded) {
        // Keep only valid rows; silently drop corrupt entries.
        return valid.sort(byDateDesc);
      }
    }

    // First run (or corrupt storage): seed realistic sample data once.
    const seed = buildSeedTransactions();
    this.storage.write(TRANSACTIONS_KEY, seed);
    this.storage.write(SEEDED_KEY, true);
    return seed;
  }

  private persist(transactions: Transaction[]): void {
    this.transactionsSubject.next(transactions);
    this.storage.write(TRANSACTIONS_KEY, transactions);
  }
}
