import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { ReuseStrategyService } from './reuse-strategy.service'; // Adjust path as needed

@Injectable({
  providedIn: 'root',
})
export class CustomReuseStrategy implements RouteReuseStrategy {
  constructor(private reuseStrategyService: ReuseStrategyService) {}

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path || '';
    const reuse = this.reuseStrategyService.isReuseAllowed(path);
    console.log(`shouldDetach: ${path} => ${reuse}`);
    return reuse;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const path = route.routeConfig?.path || '';
    if (path && handle) {
      this.reuseStrategyService.storeHandler(path, handle);
      console.log(`Stored component for: ${path}`);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path || '';
    const has = this.reuseStrategyService.hasHandler(path);
    const reuse = this.reuseStrategyService.isReuseAllowed(path);
    console.log(`shouldAttach: ${path} => handler=${has}, allowed=${reuse}`);
    return has && reuse;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = route.routeConfig?.path || '';
    const handler = this.reuseStrategyService.getHandler(path);
    console.log(`retrieve: ${path} => ${!!handler}`);
    return handler;
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
