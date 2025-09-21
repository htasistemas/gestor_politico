import { Component, OnInit } from '@angular/core';
import { FamiliasService, FamiliaResponse } from './familias.service';

@Component({

  standalone: false,

  selector: 'app-familias',
  templateUrl: './familias.component.html',
  styleUrls: ['./familias.component.css']
})
export class FamiliasComponent implements OnInit {
  destaques: { titulo: string; valor: string; variacao: string; descricao: string }[] = [];
  filtros = ['Todos', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste'];
  familias: FamiliaResponse[] = [];
  carregando = false;
  erroCarregamento = '';

  constructor(private readonly familiasService: FamiliasService) {}

  ngOnInit(): void {
    this.carregarFamilias();
  }

  obterIniciais(nome: string): string {
    if (!nome) {
      return 'NA';
    }

    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }

    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  obterResponsavel(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto || 'Responsável não informado';
  }

  obterTotalMembros(familia: FamiliaResponse): number {
    return familia.membros.length;
  }

  membrosSecundarios(familia: FamiliaResponse): FamiliaResponse['membros'] {
    return familia.membros.filter(membro => !membro.responsavelPrincipal);
  }

  dataCadastro(familia: FamiliaResponse): string {
    const data = new Date(familia.criadoEm);
    if (Number.isNaN(data.getTime())) {
      return '';
    }
    return data.toLocaleDateString();
  }

  private carregarFamilias(): void {
    this.carregando = true;
    this.erroCarregamento = '';
    this.familiasService.listarFamilias().subscribe({
      next: familias => {
        this.familias = familias;
        this.atualizarDestaques();
        this.carregando = false;
      },
      error: erro => {
        console.error('Erro ao carregar famílias', erro);
        this.erroCarregamento = 'Não foi possível carregar as famílias cadastradas.';
        this.carregando = false;
      }
    });
  }

  private atualizarDestaques(): void {
    const totalFamilias = this.familias.length;
    const responsaveisAtivos = this.familias.filter(familia =>
      familia.membros.some(membro => membro.responsavelPrincipal)
    ).length;
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const novosCadastros = this.familias.filter(familia => {
      const data = new Date(familia.criadoEm);
      return data >= seteDiasAtras;
    }).length;

    this.destaques = [
      {
        titulo: 'Famílias cadastradas',
        valor: totalFamilias.toString(),
        variacao: totalFamilias > 0 ? `+${totalFamilias}` : '+0',
        descricao: 'total registrado na base'
      },
      {
        titulo: 'Responsáveis ativos',
        valor: responsaveisAtivos.toString(),
        variacao: responsaveisAtivos > 0 ? `+${responsaveisAtivos}` : '+0',
        descricao: 'famílias com responsável definido'
      },
      {
        titulo: 'Novos cadastros',
        valor: novosCadastros.toString(),
        variacao: `+${novosCadastros} nesta semana`,
        descricao: 'entradas nos últimos 7 dias'
      }
    ];
  }
}
