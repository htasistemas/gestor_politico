import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../api-url.util';

export interface DashboardResumo {
  totalCadastrados: number;
  metaTotalPessoas: number | null;
}

export interface DashboardDistribuicaoProbabilidadeItem {
  probabilidade: string;
  quantidade: number;
}

export interface DashboardAniversariante {
  id: number;
  nome: string;
  dia: number;
  mes: number;
  bairro: string | null;
  telefone: string | null;
}

export interface DashboardTopParceiro {
  parceiroId: number;
  nome: string;
  totalFamilias: number;
}

export interface DashboardMetaResponse {
  metaTotalPessoas: number | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = buildApiUrl('dashboard');
  private readonly configuracoesUrl = buildApiUrl('configuracoes');

  constructor(private readonly http: HttpClient) {}

  obterResumo(): Observable<DashboardResumo> {
    return this.http.get<DashboardResumo>(`${this.baseUrl}/resumo`);
  }

  obterDistribuicaoProbabilidade(): Observable<DashboardDistribuicaoProbabilidadeItem[]> {
    return this.http.get<DashboardDistribuicaoProbabilidadeItem[]>(
      `${this.baseUrl}/distribuicao-probabilidade`
    );
  }

  listarAniversariantes(mes?: number): Observable<DashboardAniversariante[]> {
    let params = new HttpParams();
    if (mes) {
      params = params.set('mes', mes.toString());
    }
    return this.http.get<DashboardAniversariante[]>(`${this.baseUrl}/aniversariantes`, { params });
  }

  listarTopParceiros(): Observable<DashboardTopParceiro[]> {
    return this.http.get<DashboardTopParceiro[]>(`${this.baseUrl}/top-parceiros`);
  }

  obterMeta(): Observable<DashboardMetaResponse> {
    return this.http.get<DashboardMetaResponse>(`${this.configuracoesUrl}/dashboard-meta`);
  }

  atualizarMeta(metaTotalPessoas: number): Observable<DashboardMetaResponse> {
    return this.http.put<DashboardMetaResponse>(`${this.configuracoesUrl}/dashboard-meta`, {
      metaTotalPessoas
    });
  }
}
