import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

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

interface TopCadastrador {
  nome: string;
  totalFamilias: number;
  regiao: string;
}

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  totalCadastrados = 15847;
  meta = 20000;
  altaProbabilidade = 4704;
  mediaProbabilidade = 7892;
  baixaProbabilidade = 3251;

  tendenciaSemanal = [40, 60, 80, 100, 70, 90, 95];
  tendenciaCores = ['bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'];
  diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  pieData: PieItem[] = [
    { label: 'Alta probabilidade', value: this.altaProbabilidade, color: '#10B981', accent: '#d1fae5' },
    { label: 'Média probabilidade', value: this.mediaProbabilidade, color: '#FBBF24', accent: '#fef3c7' },
    { label: 'Baixa probabilidade', value: this.baixaProbabilidade, color: '#F87171', accent: '#fee2e2' }
  ];

  meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
  barSeries = [
    { label: 'Alta', color: '#10B981', border: '#047857', valores: [2100, 2800, 3500, 4100, 4704] },
    { label: 'Média', color: '#FBBF24', border: '#D97706', valores: [4200, 5100, 6800, 7200, 7892] },
    { label: 'Baixa', color: '#F87171', border: '#DC2626', valores: [2200, 2300, 2500, 2600, 3251] }
  ];

  private readonly dataAtual = new Date();
  nomeMesAtual = this.formatarNomeMes(this.dataAtual);

  aniversariantesDoMes: AniversarianteDoMes[] = [
    { nome: 'Ana Paula Ferreira', dia: 3, bairro: 'Centro', telefone: '(11) 98877-4521' },
    { nome: 'Carlos Eduardo Lima', dia: 7, bairro: 'Vila Nova', telefone: '(11) 99654-2018' },
    { nome: 'Mariana Souza', dia: 11, bairro: 'Jardim das Flores', telefone: '(11) 99761-3358' },
    { nome: 'Rafael Oliveira', dia: 15, bairro: 'Parque Industrial', telefone: '(11) 98941-7754' },
    { nome: 'Juliana Costa', dia: 18, bairro: 'Alto da Serra', telefone: '(11) 98254-4477' },
    { nome: 'Felipe Andrade', dia: 21, bairro: 'Vila Mariana', telefone: '(11) 98562-9981' }
  ];

  topCadastradores: TopCadastrador[] = [
    { nome: 'Patrícia Gomes', totalFamilias: 82, regiao: 'Zona Norte' },
    { nome: 'Lucas Almeida', totalFamilias: 76, regiao: 'Zona Leste' },
    { nome: 'Fernanda Ribeiro', totalFamilias: 74, regiao: 'Zona Sul' },
    { nome: 'João Pedro Silva', totalFamilias: 71, regiao: 'Centro' },
    { nome: 'Aline Martins', totalFamilias: 69, regiao: 'Zona Oeste' },
    { nome: 'Bruno Carvalho', totalFamilias: 65, regiao: 'Zona Norte' },
    { nome: 'Renata Fernandes', totalFamilias: 63, regiao: 'Zona Leste' },
    { nome: 'Marcelo Teixeira', totalFamilias: 59, regiao: 'Centro' },
    { nome: 'Gabriela Nunes', totalFamilias: 57, regiao: 'Zona Sul' },
    { nome: 'Cláudia Araujo', totalFamilias: 55, regiao: 'Zona Oeste' }
  ];

  @ViewChild('pieChartCanvas') pieChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas?: ElementRef<HTMLCanvasElement>;

  private pieChart?: Chart;
  private barChart?: Chart;

  get progressoMeta(): number {
    return Math.min(100, Math.round((this.totalCadastrados / this.meta) * 100));
  }

  get aniversariantesOrdenados(): AniversarianteDoMes[] {
    return [...this.aniversariantesDoMes].sort((a, b) => a.dia - b.dia);
  }

  ngAfterViewInit(): void {
    this.renderPieChart();
    this.renderBarChart();
  }

  ngOnDestroy(): void {
    this.pieChart?.destroy();
    this.barChart?.destroy();
  }

  private formatarNomeMes(data: Date): string {
    const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(data);
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  private renderPieChart(): void {
    const canvas = this.pieChartCanvas?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!context) return;

    this.pieChart?.destroy();
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

  private renderBarChart(): void {
    const canvas = this.barChartCanvas?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!context) return;

    this.barChart?.destroy();
    this.barChart = new Chart(context, {
      type: 'bar',
      data: {
        labels: this.meses,
        datasets: this.barSeries.map(serie => ({
          label: serie.label,
          data: serie.valores,
          backgroundColor: serie.color,
          borderColor: serie.border,
          borderRadius: 12,
          barPercentage: 0.6
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' }
          }
        }
      }
    });
  }
}
