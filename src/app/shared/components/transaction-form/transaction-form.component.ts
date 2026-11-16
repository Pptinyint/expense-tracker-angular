import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable, startWith, switchMap, take } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { NewTransaction, TransactionType } from '../../../core/models/transaction.model';
import { CategoryService } from '../../../core/services/category.service';
import { todayIso } from '../../../core/utils/date.utils';

/**
 * Reactive form for creating / editing a transaction.
 * The category dropdown follows the selected type (income vs expense).
 * Emits a clean NewTransaction payload; the parent decides add vs update.
 */
@Component({
  selector: 'app-transaction-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss',
})
export class TransactionFormComponent implements OnInit {
  /** Values to pre-fill in edit mode. Null for a fresh transaction. */
  @Input() initial: NewTransaction | null = null;
  @Input() submitLabel = 'Add transaction';
  @Output() submitted = new EventEmitter<NewTransaction>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    type: this.fb.control<TransactionType>('expense', {
      nonNullable: true,
      validators: Validators.required,
    }),
    amount: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    categoryId: this.fb.control<string>('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    date: this.fb.control<string>(todayIso(), {
      nonNullable: true,
      validators: Validators.required,
    }),
    note: this.fb.control<string>('', {
      nonNullable: true,
      validators: Validators.maxLength(120),
    }),
  });

  /** Category options for the currently selected type. */
  readonly categoryOptions$: Observable<Category[]> = this.form.controls.type.valueChanges.pipe(
    startWith(this.form.controls.type.value),
    switchMap((type) => this.categoryService.categoriesFor(type)),
  );

  ngOnInit(): void {
    if (this.initial) {
      this.form.patchValue(this.initial);
    }

    // When the type changes, clear the category if it does not belong
    // to the new type (e.g. "Salary" is not a valid expense category).
    this.form.controls.type.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((type) => this.categoryService.categoriesFor(type).pipe(take(1))),
      )
      .subscribe((categories) => {
        const current = this.form.controls.categoryId.value;
        if (!categories.some((c) => c.id === current)) {
          this.form.controls.categoryId.setValue(categories[0]?.id ?? '');
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.submitted.emit({
      type: raw.type,
      // FormControl<number | null> with a min validator: null is impossible
      // here because the form is valid at this point.
      amount: raw.amount ?? 0,
      categoryId: raw.categoryId,
      date: raw.date,
      note: raw.note.trim(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  // Convenience getters for the template's validation messages.
  get amountControl() {
    return this.form.controls.amount;
  }

  get categoryControl() {
    return this.form.controls.categoryId;
  }

  get dateControl() {
    return this.form.controls.date;
  }

  get noteControl() {
    return this.form.controls.note;
  }
}
