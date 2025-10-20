import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.estaAutenticado() || this.permiteAcessoSemLogin(state.url)) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }

  private permiteAcessoSemLogin(url: string): boolean {
    const urlTree = this.router.parseUrl(url);
    const primary = urlTree.root.children['primary'];
    if (!primary) {
      return false;
    }
    const segmentos = primary.segments.map(segmento => segmento.path);
    if (segmentos.length >= 2 && segmentos[0] === 'familias') {
      if (segmentos[1] === 'nova') {
        const tokenQuery = urlTree.queryParams['parceiroToken'];
        return typeof tokenQuery === 'string' && tokenQuery.trim().length > 0;
      }

      if (segmentos[1] === 'cadastro-parceiro' && segmentos.length >= 3) {
        const tokenRota = segmentos[2];
        return tokenRota.trim().length > 0;
      }
    }
    return false;
  }
}
