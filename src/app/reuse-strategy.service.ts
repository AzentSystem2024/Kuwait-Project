import { Injectable } from '@angular/core';
import { DetachedRouteHandle } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ReuseStrategyService {
  private handlers = new Map<string, DetachedRouteHandle>();

  storeHandler(path: string, handle: DetachedRouteHandle): void {
    this.handlers.set(path, handle);
  }

  hasHandler(path: string): boolean {
    return this.handlers.has(path);
  }

  getHandler(path: string): DetachedRouteHandle | null {
    return this.handlers.get(path) || null;
  }

  removeHandler(path: string): void {
    if (this.handlers.has(path)) {
      this.handlers.delete(path);
    }
  }

  clearHandlers(): void {
    this.handlers.clear();
  }
}
