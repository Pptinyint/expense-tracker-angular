import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  startWith,
} from 'rxjs';
import { TransactionView } from '../../core/models/transaction.model';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { formatDate, toMonthKey } from '../../core/utils/date.utils';

interface FilteredView {
  items: TransactionView[];
  count: number;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-transactions',
  imports: [AsyncPipe, CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);

  readonly monthFilter = new FormControl<string>('all', { nonNullable: true });
  readonly categoryFilter = new FormControl<string>('all', { nonNullable: true });
  /** Debounced so typing does not re-filter on every keystroke. */
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  readonly months$ = this.transactionService.availableMonths();
  readonly categories$ = this.categoryService.categories$;

  /** Id of the row currently asking "are you sure?" — null otherwise. */
  confirmingDeleteId: string | null = null;

  readonly filtered$: Observable<FilteredView> = combineLatest([
    this.transactionService.enriched$,
    this.monthFilter.valueChanges.pipe(startWith(this.monthFilter.value)),
    this.categoryFilter.valueChanges.pipe(startWith(this.categoryFilter.value)),
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
    ),
  ]).pipe(
    map(([transactions, month, categoryId, query]) => {
      const needle = query.trim().toLowerCase();
      const items = transactions
        .filter((t) => month === 'all' || toMonthKey(t.date) === month)
        .filter((t) => categoryId === 'all' || t.categoryId === categoryId)
        .filter((t) => needle === '' || t.note.toLowerCase().includes(needle))
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date < b.date ? 1 : -1;
          }
          return b.createdAt - a.createdAt;
        });
      return {
        items,
        count: items.length,
        income: items.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: items.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    }),
  );

  formatDate = formatDate;

  askDelete(id: string): void {
    this.confirmingDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmingDeleteId = null;
  }

  confirmDelete(id: string): void {
    this.transactionService.delete(id);
    this.confirmingDeleteId = null;
  }

  clearFilters(): void {
    this.monthFilter.setValue('all');
    this.categoryFilter.setValue('all');
    this.searchControl.setValue('');
  }
}
