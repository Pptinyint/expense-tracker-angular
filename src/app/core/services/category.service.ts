import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Category, CategoryKind } from '../models/category.model';
import { StorageService } from './storage.service';
import { generateId } from '../utils/common.utils';

const CATEGORIES_KEY = 'expense-tracker.categories.v1';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Salary', color: '#16a34a', kind: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', color: '#059669', kind: 'income', isDefault: true },
  { id: 'cat-other-income', name: 'Other Income', color: '#0d9488', kind: 'income', isDefault: true },
  { id: 'cat-food', name: 'Food & Dining', color: '#ea580c', kind: 'expense', isDefault: true },
  { id: 'cat-groceries', name: 'Groceries', color: '#65a30d', kind: 'expense', isDefault: true },
  { id: 'cat-transport', name: 'Transport', color: '#2563eb', kind: 'expense', isDefault: true },
  { id: 'cat-housing', name: 'Housing & Rent', color: '#7c3aed', kind: 'expense', isDefault: true },
  { id: 'cat-utilities', name: 'Utilities & Bills', color: '#0891b2', kind: 'expense', isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', color: '#db2777', kind: 'expense', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', color: '#d97706', kind: 'expense', isDefault: true },
  { id: 'cat-health', name: 'Health', color: '#dc2626', kind: 'expense', isDefault: true },
  { id: 'cat-other-expense', name: 'Other', color: '#64748b', kind: 'expense', isDefault: true },
];

const CATEGORY_COLORS = [
  '#e11d48',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#059669',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
];

/**
 * Owns the list of categories. Defaults ship with the app; users can add
 * their own and delete only the ones they added.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly storage = inject(StorageService);
  private readonly categoriesSubject = new BehaviorSubject<Category[]>(this.load());

  readonly categories$ = this.categoriesSubject.asObservable();

  /** Categories usable for a given transaction type. */
  categoriesFor(kind: CategoryKind): Observable<Category[]> {
    return this.categories$.pipe(map((cats) => cats.filter((c) => c.kind === kind)));
  }

  getById(id: string): Category | undefined {
    return this.categoriesSubject.value.find((c) => c.id === id);
  }

  addCategory(name: string, kind: CategoryKind): Category {
    const category: Category = {
      id: generateId(),
      name: name.trim(),
      color: CATEGORY_COLORS[this.categoriesSubject.value.length % CATEGORY_COLORS.length],
      kind,
      isDefault: false,
    };
    this.persist([...this.categoriesSubject.value, category]);
    return category;
  }

  /** Default categories are protected; custom ones can be removed. */
  removeCategory(id: string): void {
    const target = this.getById(id);
    if (!target || target.isDefault) {
      return;
    }
    this.persist(this.categoriesSubject.value.filter((c) => c.id !== id));
  }

  private load(): Category[] {
    const stored = this.storage.read<unknown>(CATEGORIES_KEY, []);
    if (!Array.isArray(stored)) {
      return DEFAULT_CATEGORIES;
    }
    const valid = stored.filter(
      (item): item is Category =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Category).id === 'string' &&
        typeof (item as Category).name === 'string' &&
        ((item as Category).kind === 'income' || (item as Category).kind === 'expense'),
    );
    return valid.length > 0 ? valid : DEFAULT_CATEGORIES;
  }

  private persist(categories: Category[]): void {
    this.categoriesSubject.next(categories);
    this.storage.write(CATEGORIES_KEY, categories);
  }
}
