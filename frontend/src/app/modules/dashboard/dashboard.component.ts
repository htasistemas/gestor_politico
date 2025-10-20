import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import {
  DashboardAniversariante,
  DashboardDistribuicaoProbabilidadeItem,
  DashboardService,
  DashboardTopParceiro
} from '../shared/services/dashboard.service';

interface PieItem {
  label: string;
  value: number;
  color: string;
  accent: string;
}

interface AniversarianteDoMes {
  nome: string;
  dia: number;
  bairro: string;
  telefone: string;
}

interface TopParceiro {
  nome: string;
  totalFamilias: number;
}

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  totalCadastrados = 0;
  meta: number | null = null;
  altaProbabilidade = 0;
  mediaProbabilidade = 0;
  baixaProbabilidade = 0;

  tendenciaSemanal = [40, 60, 80, 100, 70, 90, 95];
  tendenciaCores = ['bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'];
  diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  pieData: PieItem[] = [];

  private readonly dataAtual = new Date();
  nomeMesAtual = this.formatarNomeMes(this.dataAtual);

  aniversariantesDoMes: AniversarianteDoMes[] = [];

  topParceiros: TopParceiro[] = [];

  @ViewChild('pieChartCanvas') pieChartCanvas?: ElementRef<HTMLCanvasElement>;

  private pieChart?: Chart;
  private viewInicializada = false;
  private probabilidadesExtras: PieItem[] = [];
  private readonly coresExtras = ['#6366F1', '#8B5CF6', '#EC4899', '#F97316', '#22D3EE'];
  private readonly tonsExtras = ['#e0e7ff', '#ede9fe', '#fce7f3', '#ffedd5', '#cffafe'];

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarDistribuicao();
    this.carregarAniversariantes();
    this.carregarTopParceiros();
  }

  get progressoMeta(): number {
    if (!this.meta || this.meta <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.totalCadastrados / this.meta) * 100));
  }

  get aniversariantesOrdenados(): AniversarianteDoMes[] {
    return [...this.aniversariantesDoMes].sort((a, b) => a.dia - b.dia);
  }

  ngAfterViewInit(): void {
    this.viewInicializada = true;
    this.renderPieChart();
  }

  ngOnDestroy(): void {
    this.pieChart?.destroy();
  }

  private carregarResumo(): void {
    this.dashboardService.obterResumo().subscribe(resumo => {
      this.totalCadastrados = resumo.totalCadastrados ?? 0;
      this.meta = resumo.metaTotalPessoas ?? null;
    });
  }

  private carregarDistribuicao(): void {
    this.dashboardService.obterDistribuicaoProbabilidade().subscribe(items => {
      this.atualizarValoresProbabilidade(items);
      this.pieData = this.montarPieData();
      this.atualizarGraficoPizza();
    });
  }

  private carregarAniversariantes(): void {
    this.dashboardService.listarAniversariantes().subscribe(aniversariantes => {
      if (aniversariantes.length > 0) {
        this.nomeMesAtual = this.formatarNomeMesNumero(aniversariantes[0].mes);
      } else {
        this.nomeMesAtual = this.formatarNomeMes(this.dataAtual);
      }
      this.aniversariantesDoMes = aniversariantes.map(this.mapearAniversariante);
    });
  }

  private carregarTopParceiros(): void {
    this.dashboardService.listarTopParceiros().subscribe(parceiros => {
      this.topParceiros = parceiros.map(parceiro => ({
        nome: parceiro.nome || 'Parceiro sem nome',
        totalFamilias: parceiro.totalFamilias
      }));
    });
  }

  private mapearAniversariante(aniversariante: DashboardAniversariante): AniversarianteDoMes {
    return {
      nome: aniversariante.nome,
      dia: aniversariante.dia,
      bairro: aniversariante.bairro || 'Bairro não informado',
      telefone: aniversariante.telefone || 'Telefone não informado'
    };
  }

  private atualizarValoresProbabilidade(items: DashboardDistribuicaoProbabilidadeItem[]): void {
    this.altaProbabilidade = 0;
    this.mediaProbabilidade = 0;
    this.baixaProbabilidade = 0;
    this.probabilidadesExtras = [];

    items.forEach((item, index) => {
      const valorNormalizado = item.probabilidade?.trim().toLowerCase();
      if (valorNormalizado === 'alta') {
        this.altaProbabilidade = item.quantidade;
      } else if (valorNormalizado === 'média' || valorNormalizado === 'media') {
        this.mediaProbabilidade = item.quantidade;
      } else if (valorNormalizado === 'baixa') {
        this.baixaProbabilidade = item.quantidade;
      } else {
        const cor = this.coresExtras[index % this.coresExtras.length];
        const fundo = this.tonsExtras[index % this.tonsExtras.length];
        this.probabilidadesExtras.push({
          label: item.probabilidade || 'Não informado',
          value: item.quantidade,
          color: cor,
          accent: fundo
        });
      }
    });
  }

  private montarPieData(): PieItem[] {
    const dados: PieItem[] = [
      { label: 'Alta probabilidade', value: this.altaProbabilidade, color: '#10B981', accent: '#d1fae5' },
      { label: 'Média probabilidade', value: this.mediaProbabilidade, color: '#FBBF24', accent: '#fef3c7' },
      { label: 'Baixa probabilidade', value: this.baixaProbabilidade, color: '#F87171', accent: '#fee2e2' }
    ];
    return [...dados, ...this.probabilidadesExtras];
  }

  private formatarNomeMes(data: Date): string {
    const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(data);
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  private formatarNomeMesNumero(mes: number): string {
    const data = new Date(this.dataAtual.getFullYear(), mes - 1, 1);
    return this.formatarNomeMes(data);
  }

  private renderPieChart(): void {
    const canvas = this.pieChartCanvas?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!context) return;

    this.pieChart?.destroy();
    if (this.pieData.length === 0) {
      return;
    }
    this.pieChart = new Chart(context, {
      type: 'doughnut',
      data: {
        labels: this.pieData.map(item => item.label),
        datasets: [
          {
            data: this.pieData.map(item => item.value),
            backgroundColor: this.pieData.map(item => item.color),
            hoverOffset: 6,
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        ]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        cutout: '65%'
      }
    });
  }

  private atualizarGraficoPizza(): void {
    if (!this.viewInicializada) {
      return;
    }
    this.renderPieChart();
  }

  calcularPercentual(valor: number): number {
    if (this.totalCadastrados <= 0) {
      return 0;
    }
    return (valor * 100) / this.totalCadastrados;
  }
}
