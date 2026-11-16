import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';
import { currentMonthKey, formatDate, monthKeyToLabel } from '../../core/utils/date.utils';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly transactionService = inject(TransactionService);

  readonly monthKey = currentMonthKey();
  readonly monthLabel = monthKeyToLabel(this.monthKey);

  readonly totals$ = this.transactionService.monthTotals(this.monthKey);
  readonly breakdown$ = this.transactionService.categoryBreakdown(this.monthKey);
  readonly recent$ = this.transactionService.recent(5);

  formatDate = formatDate;
}
