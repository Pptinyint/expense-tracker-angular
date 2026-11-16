import { Transaction } from '../models/transaction.model';

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Sample data shown on first run so the dashboard is not empty.
 * Dates are generated relative to "today", so the current month always
 * has data whichever month the app is opened in.
 */
export function buildSeedTransactions(now: Date = new Date()): Transaction[] {
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  // [year, month] for `monthsBack` months ago.
  const monthAgo = (monthsBack: number): [number, number] => {
    const d = new Date(year, month - 1 - monthsBack, 1);
    return [d.getFullYear(), d.getMonth() + 1];
  };
  const [prevYear, prevMonth] = monthAgo(1);
  const [prevYear2, prevMonth2] = monthAgo(2);

  let n = 0;
  const tx = (
    type: Transaction['type'],
    amount: number,
    categoryId: string,
    date: string,
    note: string,
  ): Transaction => ({
    id: `seed-${++n}`,
    type,
    amount,
    categoryId,
    date,
    note,
    createdAt: new Date(date).getTime() + n,
  });

  return [
    tx('income', 85000, 'cat-salary', iso(year, month, 1), 'Monthly salary'),
    tx('expense', 18000, 'cat-housing', iso(year, month, 2), 'House rent'),
    tx('expense', 4200, 'cat-groceries', iso(year, month, 4), 'Weekly groceries — BigBasket'),
    tx('expense', 850, 'cat-transport', iso(year, month, 5), 'Metro card recharge'),
    tx('expense', 1299, 'cat-entertainment', iso(year, month, 7), 'Netflix + Spotify'),
    tx('expense', 2350, 'cat-food', iso(year, month, 9), 'Dinner with friends — Swiggy'),
    tx('income', 12000, 'cat-freelance', iso(year, month, 12), 'Freelance landing page'),
    tx('expense', 1800, 'cat-health', iso(year, month, 14), 'Pharmacy — medicines'),
    tx('income', 85000, 'cat-salary', iso(prevYear, prevMonth, 1), 'Monthly salary'),
    tx('expense', 18000, 'cat-housing', iso(prevYear, prevMonth, 2), 'House rent'),
    tx('income', 85000, 'cat-salary', iso(prevYear2, prevMonth2, 1), 'Monthly salary'),
    tx('expense', 18000, 'cat-housing', iso(prevYear2, prevMonth2, 2), 'House rent'),
  ];
}
