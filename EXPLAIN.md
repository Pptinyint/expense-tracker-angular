# Expense Tracker — Interview Guide

This file is for you, Pratiksha — so you can explain this project easily in an interview. Everything is in easy English.

## What is this project?

Expense Tracker is a personal finance app. Users can add their income and expenses, filter by month and category, and see on the dashboard how much came in, how much went out, and which category had the most spending this month.

**Tech:** Angular 22, TypeScript (strict mode), RxJS, Reactive Forms, localStorage. No backend, no UI library — all hand-written SCSS.

## Folder structure

```
src/app/
├── core/            → models + services + utils (the "brain" of the app)
│   ├── models/      → Transaction, Category (only type definitions)
│   ├── services/    → TransactionService, CategoryService, StorageService
│   └── utils/       → date helpers, id generator
├── features/        → each page in its own folder
│   ├── dashboard/       → this month's summary + category bars + recent 5
│   ├── transactions/    → all entries, filter + search + edit/delete
│   ├── add-transaction/ → add/edit form (one form does both jobs)
│   ├── categories/      → add/remove categories
│   └── summary/         → income vs expense for every month
├── shared/          → transaction-form (add and edit both use it)
├── app.routes.ts    → all routes + lazy loading
└── app.config.ts    → setup
```

## What does each service do?

### TransactionService (`core/services/transaction.service.ts`)
- **Work:** It manages all transaction data — add, update, delete, and all calculations.
- **How it works:**
  - One `BehaviorSubject<Transaction[]>` is there — the full list in one place. On every change, `persist()` runs: first it gives the new array to the subject, then it saves it in localStorage.
  - **Derived streams:** totals, category breakdown, monthly summary — these are not stored separately. They are calculated from the same one stream with `map` and `combineLatest`. So data is in one place, and every calculation updates by itself.
  - `enriched$` — it joins transactions and categories with `combineLatest`, so every transaction also gets its category name and colour. `shareReplay` stops this calculation from running again and again.
  - **Seed data:** On the first run, 12 realistic entries (salary, rent, groceries, Swiggy, metro...) are made by themselves — so the app does not look empty. This happens only one time (tracked with a flag).
  - **Safety:** If localStorage data is corrupt, `isValidTransaction` checks it and ignores the bad entries. The app does not crash.

### CategoryService
- **Work:** It manages categories — 12 default categories (protected, they cannot be deleted) + users can add or remove their own custom categories.
- Every category shows a live usage count — how many transactions are in that category.

### StorageService
- **Work:** A small wrapper for localStorage read/write — so the rest of the code does not use `localStorage` directly, and error handling is in one place.

## Routes and lazy loading

- `/` → dashboard
- `/transactions` → all entries (month + category filter, 300ms debounced search)
- `/add` → new entry; `/add/:id` → the same form for edit
- `/categories` → category management
- `/summary` → month-wise income vs expense

**Lazy loading:** all five pages load in separate chunks. Initial bundle ~72 kB transfer size.

## Interview questions (with short answers)

**Q: How did you manage state?**
A: "There is one BehaviorSubject in TransactionService — single source of truth. All totals and summaries come from it with RxJS operators (map, combineLatest). I did not duplicate state in many places."

**Q: How does one form work for both add and edit?**
A: "TransactionForm is a shared component. For add, an empty form opens. For edit, we take the id from the route and fill the data with getById. The same validation works in both places."

**Q: Why debounceTime in search?**
A: "Running the filter on every keystroke is a waste. We wait 300ms and then search, so typing stays smooth."

**Q: How does data stay after refresh?**
A: "Every change is saved in localStorage. On app start we load it, and corrupt data is removed by validation."

**Q: Where did you use combineLatest, and why?**
A: "For enriched transactions — I need both the transactions stream and the categories stream. When any one of them changes, the combined result updates by itself."

**Q: Why shareReplay?**
A: "So the enriched list calculation does not run again for every subscriber — calculate one time, then all subscribers get the cached value."

**Q: Why did you add seed data?**
A: "On the first run, an empty app does not look good. With realistic sample data, the dashboard and charts show at once, and the user understands what the app does."

## How to run

```bash
npm install
npm start        # http://localhost:4200
npm run build    # production build check
```
