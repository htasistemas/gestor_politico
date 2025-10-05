import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type DemandaUrgencia = 'Baixa' | 'Média' | 'Alta';
export type DemandaStatus = 'Pendente' | 'Em andamento' | 'Concluída';

export interface Demanda {
  id: string;
  familiaId: number;
  titulo: string;
  descricao: string;
  urgencia: DemandaUrgencia;
  status: DemandaStatus;
  dataCriacao: string;
  dataLimite: string | null;
  dataConclusao: string | null;
}

export interface CriarDemandaPayload {
  familiaId: number;
  titulo: string;
  descricao: string;
  urgencia: DemandaUrgencia;
  dataLimite: string | null;
}

const STORAGE_KEY = 'gestor-politico-demandas';

@Injectable({
  providedIn: 'root'
})
export class DemandasService {
  private readonly demandasSubject: BehaviorSubject<Demanda[]>;
  private memoria: Demanda[] = [];

  constructor() {
    const carregadas = this.carregarDemandas();
    this.memoria = carregadas;
    this.demandasSubject = new BehaviorSubject<Demanda[]>(carregadas);
  }

  observarDemandas(): Observable<Demanda[]> {
    return this.demandasSubject.asObservable();
  }

  obterDemandasAtuais(): Demanda[] {
    return this.demandasSubject.value;
  }

  criarDemanda(payload: CriarDemandaPayload): Demanda {
    const novaDemanda: Demanda = {
      id: this.gerarId(),
      familiaId: payload.familiaId,
      titulo: payload.titulo.trim(),
      descricao: payload.descricao.trim(),
      urgencia: payload.urgencia,
      status: 'Pendente',
      dataCriacao: new Date().toISOString(),
      dataLimite: payload.dataLimite,
      dataConclusao: null
    };

    const demandas = [...this.obterDemandasAtuais(), novaDemanda];
    this.persistir(demandas);
    return novaDemanda;
  }

  atualizarDemanda(id: string, alteracoes: Partial<Omit<Demanda, 'id' | 'familiaId' | 'dataCriacao'>>): Demanda | null {
    const demandas = this.obterDemandasAtuais();
    const indice = demandas.findIndex(demanda => demanda.id === id);
    if (indice === -1) {
      return null;
    }

    const atual = demandas[indice];
    const atualizado: Demanda = {
      ...atual,
      ...alteracoes
    };

    if (alteracoes.status) {
      if (alteracoes.status === 'Concluída') {
        atualizado.dataConclusao = alteracoes.dataConclusao ?? new Date().toISOString();
      } else {
        atualizado.dataConclusao = null;
      }
    }

    const copia = [...demandas];
    copia[indice] = atualizado;
    this.persistir(copia);
    return atualizado;
  }

  removerDemanda(id: string): void {
    const filtradas = this.obterDemandasAtuais().filter(demanda => demanda.id !== id);
    this.persistir(filtradas);
  }

  contarAbertasPorFamilia(familiaId: number): number {
    return this.obterDemandasAtuais().filter(demanda => demanda.familiaId === familiaId && demanda.status !== 'Concluída').length;
  }

  listarPorFamilia(familiaId: number): Demanda[] {
    return this.obterDemandasAtuais().filter(demanda => demanda.familiaId === familiaId);
  }

  private persistir(demandas: Demanda[]): void {
    this.memoria = demandas;
    if (this.storageDisponivel()) {
      try {
        const texto = JSON.stringify(demandas);
        window.localStorage.setItem(STORAGE_KEY, texto);
      } catch (erro) {
        console.warn('Não foi possível salvar as demandas no armazenamento local.', erro);
      }
    }
    this.demandasSubject.next(demandas);
  }

  private carregarDemandas(): Demanda[] {
    if (this.storageDisponivel()) {
      try {
        const texto = window.localStorage.getItem(STORAGE_KEY);
        if (!texto) {
          return [];
        }
        const parsed = JSON.parse(texto) as Demanda[];
        if (Array.isArray(parsed)) {
          return parsed.map(demanda => ({
            ...demanda,
            descricao: demanda.descricao || '',
            dataLimite: demanda.dataLimite ?? null,
            dataConclusao: demanda.dataConclusao ?? null
          }));
        }
      } catch (erro) {
        console.warn('Não foi possível carregar as demandas salvas.', erro);
      }
    }
    return [...this.memoria];
  }

  private storageDisponivel(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private gerarId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return `${timestamp}-${random}`;
  }
}
