import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NewTransaction } from '../../core/models/transaction.model';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionFormComponent } from '../../shared/components/transaction-form/transaction-form.component';

/**
 * One page for both creating and editing a transaction.
 * Edit mode is driven by the `:id` route param (e.g. /add/abc123).
 * The form itself lives in the shared TransactionFormComponent.
 */
@Component({
  selector: 'app-add-transaction',
  imports: [TransactionFormComponent],
  templateUrl: './add-transaction.component.html',
  styleUrl: './add-transaction.component.scss',
})
export class AddTransactionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transactionService = inject(TransactionService);

  private readonly editingId = this.route.snapshot.paramMap.get('id');

  readonly isEditMode = this.editingId !== null;
  initialValue: NewTransaction | null = null;
  notFound = false;

  ngOnInit(): void {
    if (!this.editingId) {
      return;
    }
    const existing = this.transactionService.getById(this.editingId);
    if (!existing) {
      this.notFound = true;
      return;
    }
    this.initialValue = {
      type: existing.type,
      amount: existing.amount,
      categoryId: existing.categoryId,
      date: existing.date,
      note: existing.note,
    };
  }

  onSubmit(data: NewTransaction): void {
    if (this.isEditMode && this.editingId) {
      this.transactionService.update(this.editingId, data);
    } else {
      this.transactionService.add(data);
    }
    void this.router.navigate(['/transactions']);
  }

  onCancel(): void {
    void this.router.navigate(['/transactions']);
  }
}
