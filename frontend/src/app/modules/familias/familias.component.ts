import { Component } from '@angular/core';

@Component({
  selector: 'app-familias',
  templateUrl: './familias.component.html',
  styleUrls: ['./familias.component.css']
})
export class FamiliasComponent {
  destaques = [
    {
      titulo: 'Famílias cadastradas',
      valor: '128',
      variacao: '+8,4%',
      descricao: 'crescimento nos últimos 30 dias'
    },
    {
      titulo: 'Responsáveis ativos',
      valor: '94',
      variacao: '+5,1%',
      descricao: 'com engajamento confirmado'
    },
    {
      titulo: 'Novos cadastros',
      valor: '12',
      variacao: '+3 nesta semana',
      descricao: 'aguardando validação'
    }
  ];

  filtros = ['Todos', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste'];
}
