import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-summary',
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly transactionService = inject(TransactionService);

  readonly summaries$ = this.transactionService.monthlySummaries();

  /** Width of the expense bar relative to that month's income. */
  expenseBarWidth(income: number, expense: number): number {
    if (income <= 0) {
      return expense > 0 ? 100 : 0;
    }
    return Math.min(100, (expense / income) * 100);
  }
}
