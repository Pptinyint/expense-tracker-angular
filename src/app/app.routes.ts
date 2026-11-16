import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./features/add-transaction/add-transaction.component').then(
        (m) => m.AddTransactionComponent,
      ),
  },
  {
    path: 'add/:id',
    loadComponent: () =>
      import('./features/add-transaction/add-transaction.component').then(
        (m) => m.AddTransactionComponent,
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('./features/summary/summary.component').then((m) => m.SummaryComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
