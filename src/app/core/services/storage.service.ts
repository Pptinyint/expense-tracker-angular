import { Injectable } from '@angular/core';

/**
 * Thin, defensive wrapper around localStorage.
 * - Returns the caller's fallback when the key is missing, the JSON is
 *   corrupt, or storage is unavailable (private mode, quota, SSR).
 * - Never throws: corrupt data is logged and ignored instead of crashing
 *   the app on startup.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  read<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) {
      return fallback;
    }
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(`[StorageService] Corrupt data under key "${key}". Using fallback.`);
      return fallback;
    }
  }

  write(key: string, value: unknown): void {
    if (!this.isAvailable()) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`[StorageService] Failed to write key "${key}".`, err);
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) {
      return;
    }
    localStorage.removeItem(key);
  }

  private isAvailable(): boolean {
    try {
      const probe = '__expense_tracker_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }
}
