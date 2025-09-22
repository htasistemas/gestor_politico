import { Component } from '@angular/core';

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
export class TopNavComponent {
  menuItems: TopNavItem[] = [
    {
      label: 'Dashboard',
      description: 'Visão geral dos indicadores',
      icon: 'M3 13.5h4.5V21H3v-7.5zm6-9H13.5V21H9V4.5zm6 6H21V21h-6V10.5z',
      route: '/dashboard'
    },
    {
      label: 'Famílias',
      description: 'Gestão de núcleos familiares',
      icon: 'M12 7a4 4 0 110 8 4 4 0 010-8zm0-5a6 6 0 016 6v1.26a8 8 0 014 6.91V21h-2v-4a4 4 0 00-4-4h-8a4 4 0 00-4 4v4H2v-4.83a8 8 0 014-6.91V8a6 6 0 016-6z',
      route: '/familias'
    },
    {
      label: 'Pessoas',
      description: 'Cadastro e geolocalização',
      icon: 'M16 11V7a4 4 0 10-8 0v4m12 10H4a2 2 0 01-2-2v-6a2 2 0 012-2h16a2 2 0 012 2v6a2 2 0 01-2 2z',
      route: '/pessoas'
    },
    {
      label: 'Configurações',
      description: 'Importar bairros e regiões',
      icon: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 4.34l1.63 1.27a.5.5 0 01-.03.79l-1.94 1.12c-.14.77-.4 1.5-.74 2.18l.3 2.23a.5.5 0 01-.62.54l-2.2-.63c-.64.46-1.34.83-2.08 1.08l-.99 2.04a.5.5 0 01-.76.16l-1.63-1.27a7.98 7.98 0 01-2.18.74l-1.12 1.94a.5.5 0 01-.79.03l-1.27-1.63a8.06 8.06 0 01-2.34-.3l-2.23.3a.5.5 0 01-.54-.62l.63-2.2a7.96 7.96 0 01-1.08-2.08l-2.04-.99a.5.5 0 01-.16-.76l1.27-1.63a8 8 0 010-4.36L1.3 9.4a.5.5 0 01.16-.76l2.04-.99c.25-.74.62-1.44 1.08-2.08l-.63-2.2a.5.5 0 01.54-.62l2.23.3c.74-.25 1.44-.62 2.08-1.08l.99-2.04a.5.5 0 01.76-.16l1.63 1.27c.71-.2 1.44-.35 2.18-.43L13.5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5l.3 2.23c.76.14 1.5.4 2.18.74l2.04-.99a.5.5 0 01.76.16l1.27 1.63c.46.64.83 1.34 1.08 2.08l2.2.63a.5.5 0 01.62.54l-.3 2.23c.31.76.47 1.55.47 2.34s-.16 1.58-.47 2.34z',
      route: '/configuracoes'
    }
  ];
}
