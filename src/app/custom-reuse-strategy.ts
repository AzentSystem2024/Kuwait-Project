import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { ReuseStrategyService } from './reuse-strategy.service';

@Injectable({
  providedIn: 'root',
})
export class CustomReuseStrategy implements RouteReuseStrategy {
  constructor(private reuseStrategyService: ReuseStrategyService) {}

  private isAuthRoute(route: ActivatedRouteSnapshot): boolean {
    const fullUrl = this.getFullUrl(route);
    return fullUrl.startsWith('/auth');
  }

  private getFullUrl(route: ActivatedRouteSnapshot): string {
    return (
      '/' +
      route.pathFromRoot
        .map((r) => r.routeConfig?.path)
        .filter(Boolean)
        .join('/')
    );
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !this.isAuthRoute(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (!this.isAuthRoute(route)) {
      const path = this.getFullUrl(route);
      if (handle) {
        this.reuseStrategyService.storeHandler(path, handle);
        console.log('Stored component:', path);
      }
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getFullUrl(route);
    return this.reuseStrategyService.hasHandler(path);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = this.getFullUrl(route);
    return this.reuseStrategyService.getHandler(path);
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  removeStoredComponent(routePath: string): void {
    this.reuseStrategyService.removeHandler(routePath);
  }

  clearStoredData(): void {
    this.reuseStrategyService.clearHandlers();
  }
}
