import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.estaAutenticado() && this.authService.ehAdministrador()) {
      return true;
    }
    if (!this.authService.estaAutenticado()) {
      return this.router.createUrlTree(['/login']);
    }
    return this.router.createUrlTree(['/dashboard']);
  }
}
