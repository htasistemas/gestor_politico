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
      label: 'Indicadores',
      description: 'Relatórios e projeções',
      icon: 'M4 6h16M4 12h10M4 18h6',
      route: '/dashboard'
    }
  ];
}
