import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

interface PieItem {
  label: string;
  value: number;
  color: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  totalCadastrados = 15420;
  meta = 20000;
  altaProbabilidade = 7820;
  mediaProbabilidade = 5120;
  baixaProbabilidade = 2480;

  tendenciaSemanal = [40, 60, 80, 100, 70, 90, 95];
  tendenciaCores = ['bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'];
  diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  pieData: PieItem[] = [
    { label: 'Alta probabilidade', value: this.altaProbabilidade, color: '#10B981', accent: '#d1fae5' },
    { label: 'Média probabilidade', value: this.mediaProbabilidade, color: '#FBBF24', accent: '#fef3c7' },
    { label: 'Baixa probabilidade', value: this.baixaProbabilidade, color: '#F87171', accent: '#fee2e2' }
  ];

  meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  barSeries = [
    { label: 'Alta', color: '#10B981', border: '#047857', valores: [420, 480, 520, 600, 620, 680] },
    { label: 'Média', color: '#FBBF24', border: '#D97706', valores: [360, 420, 460, 520, 540, 560] },
    { label: 'Baixa', color: '#F87171', border: '#DC2626', valores: [180, 200, 220, 240, 260, 280] }
  ];

  @ViewChild('pieChartCanvas') pieChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas?: ElementRef<HTMLCanvasElement>;

  private pieChart?: Chart;
  private barChart?: Chart;

  get progressoMeta(): number {
    return Math.min(100, Math.round((this.totalCadastrados / this.meta) * 100));
  }

  ngAfterViewInit(): void {
    this.renderPieChart();
    this.renderBarChart();
  }

  ngOnDestroy(): void {
    this.pieChart?.destroy();
    this.barChart?.destroy();
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
