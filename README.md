# Expense Tracker — Angular

A clean, responsive expense tracker built with Angular. Record income and
expenses, organise them by category, filter and search them, and see monthly
summaries — all stored locally in your browser. No account, no backend.

## Features

- **Dashboard** — income, spending and balance for the current month, spending
  breakdown by category, and the 5 most recent transactions.
- **Add / edit transactions** — reactive form with validation (type, amount,
  category, date, note). The same form is reused for editing.
- **Transactions page** — filter by month and category, debounced search by
  note text, delete with inline confirmation, edit any entry.
- **Category management** — 12 sensible defaults plus your own custom
  categories (income or expense), with a live usage count per category.
- **Monthly summary** — per-month income vs expense, balance, and how much of
  the month's income was spent.
- **Local persistence** — everything is saved in `localStorage`; corrupt
  stored data is detected and ignored instead of crashing the app.
- **Seed data** — on first run the app seeds 12 realistic sample transactions
  across the last three months, so the dashboard looks alive immediately.

## Tech stack

- Angular 22 (standalone components, lazy-loaded routes)
- TypeScript (strict mode)
- Reactive Forms + RxJS (`BehaviorSubject`, `combineLatest`, `map`,
  `debounceTime`, `shareReplay`)
- SCSS, hand-written responsive CSS — no UI library
- localStorage for persistence

## Run it

```bash
npm install
npm start        # ng serve — open http://localhost:4200
```

Production build:

```bash
npm run build    # output goes to dist/
```

## Folder structure

```
src/app
├── app.ts / app.html / app.scss   # App shell: header, nav, footer
├── app.routes.ts                  # Lazy-loaded routes
├── core/
│   ├── models/                    # Transaction + Category types
│   ├── services/
│   │   ├── transaction.service.ts # State + all RxJS-derived views
│   │   ├── category.service.ts    # Default + custom categories
│   │   ├── storage.service.ts     # Safe localStorage wrapper
│   │   └── seed-data.ts           # First-run sample data
│   └── utils/                     # Date + id helpers
├── features/
│   ├── dashboard/                 # Monthly totals, breakdown, recent list
│   ├── transactions/              # Filter / search / edit / delete
│   ├── add-transaction/           # Add + edit page (shared form)
│   ├── categories/                # Category management
│   └── summary/                   # Per-month income vs expense
└── shared/
    └── components/transaction-form/  # Reusable reactive form
```

## How state works

`TransactionService` holds one `BehaviorSubject<Transaction[]>` and persists
every change to `localStorage`. Everything else — monthly totals, category
breakdowns, filtered lists, monthly summaries — is derived from that single
stream with RxJS operators, so there is no duplicated state to go stale.
