import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, UsuarioAutenticado } from '../../modules/shared/services/auth.service';

interface TopNavItem {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  standalone: false,
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent implements OnDestroy {
  menuItems: TopNavItem[] = [];
  usuarioLogado: UsuarioAutenticado | null = null;
  menuPerfilAberto = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly authService: AuthService, private readonly router: Router) {
    this.authService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        this.usuarioLogado = usuario;
        this.menuItems = this.criarMenu(usuario);
        if (!usuario) {
          this.menuPerfilAberto = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  alternarMenuPerfil(evento: MouseEvent): void {
    evento.stopPropagation();
    this.menuPerfilAberto = !this.menuPerfilAberto;
  }

  @HostListener('document:click')
  fecharMenuPerfil(): void {
    this.menuPerfilAberto = false;
  }

  navegarParaPerfil(): void {
    this.menuPerfilAberto = false;
    this.router.navigate(['/perfil']);
  }

  navegarParaUsuarios(): void {
    this.menuPerfilAberto = false;
    this.router.navigate(['/usuarios']);
  }

  sair(): void {
    this.menuPerfilAberto = false;
    this.authService.logout();
  }

  private criarMenu(usuario: UsuarioAutenticado | null): TopNavItem[] {
    if (!usuario) {
      return [];
    }
    const itensBase: TopNavItem[] = [
      {
        label: 'Dashboard',
        description: 'Visão geral dos indicadores',
        icon: 'M3 13.5h4.5V21H3v-7.5zm6-9H13.5V21H9V4.5zm6 6H21V21h-6V10.5z',
        route: '/dashboard'
      },
      {
        label: 'Famílias',
        description: 'Gestão de núcleos familiares',
        icon: 'M12 7a4 4 0 110 8 4 4 0 010-8zm0-5a6 6 0 016 6v1.26a8 8 0 014 6.91V21h-2v-4a4 4 0 00-4-4h-8a4 4 0 00-4 4v4H2v-4.83a',
        route: '/familias'
      }
    ];

    if (usuario?.perfil === 'ADMINISTRADOR') {
      itensBase.push({
        label: 'Configurações de região',
        description: 'Importar bairros e definir regiões',
        icon: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 4.34l1.63 1.27a.5.5 0 01-.03.79l-1.94 1.12c-.14.77-',
        route: '/configuracoes'
      });
    }

    return itensBase;
  }
}
