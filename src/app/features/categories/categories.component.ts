import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, Observable } from 'rxjs';
import { Category, CategoryKind } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';

interface CategoryWithUsage extends Category {
  usageCount: number;
}

@Component({
  selector: 'app-categories',
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly fb = inject(FormBuilder);

  readonly nameControl = this.fb.control('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
  });
  readonly kindControl = this.fb.control<CategoryKind>('expense', { nonNullable: true });

  /** Categories with a live count of how many transactions use each one. */
  readonly categoriesWithUsage$: Observable<CategoryWithUsage[]> = combineLatest([
    this.categoryService.categories$,
    this.transactionService.transactions$,
  ]).pipe(
    map(([categories, transactions]) => {
      const usage = new Map<string, number>();
      for (const t of transactions) {
        usage.set(t.categoryId, (usage.get(t.categoryId) ?? 0) + 1);
      }
      return categories.map((c) => ({
        ...c,
        usageCount: usage.get(c.id) ?? 0,
      }));
    }),
  );

  addCategory(): void {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    this.categoryService.addCategory(this.nameControl.value.trim(), this.kindControl.value);
    this.nameControl.reset('');
    this.kindControl.setValue('expense');
  }

  removeCategory(id: string): void {
    this.categoryService.removeCategory(id);
  }
}
