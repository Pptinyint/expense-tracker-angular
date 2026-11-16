export type CategoryKind = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  /** Hex colour used for the category badge / chart bar. */
  color: string;
  kind: CategoryKind;
  /** Default categories ship with the app and cannot be deleted. */
  isDefault: boolean;
}
