import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FamiliasService, FamiliaResponse } from '../familias/familias.service';
import {
  CriarDemandaPayload,
  Demanda,
  DemandaStatus,
  DemandaUrgencia,
  DemandasService
} from '../shared/services/demandas.service';
import { NotificationService } from '../shared/services/notification.service';

interface DemandaDetalhada extends Demanda {
  familiaNome: string;
  responsavel: string;
  endereco: string;
}

interface SecaoDemandas {
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
  status: DemandaStatus;
  demandas: DemandaDetalhada[];
}

@Component({
  standalone: false,
  selector: 'app-demandas',
  templateUrl: './demandas.component.html',
  styleUrls: ['./demandas.component.css']
})
export class DemandasComponent implements OnInit, OnDestroy {
  formulario: FormGroup;
  familias: FamiliaResponse[] = [];
  carregandoFamilias = false;
  erroFamilias = '';
  resumoDemandas = {
    pendentes: 0,
    emAndamento: 0,
    concluidas: 0
  };
  filtroStatus: '' | DemandaStatus = '';
  filtroUrgencia: '' | DemandaUrgencia = '';
  filtroBusca = '';
  secoes: SecaoDemandas[] = [];
  semDemandasFiltradas = false;
  private todasDemandas: Demanda[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly familiasService: FamiliasService,
    private readonly demandasService: DemandasService,
    private readonly notificationService: NotificationService
  ) {
    this.formulario = this.fb.group({
      familiaId: [null, Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
      urgencia: ['Média', Validators.required],
      dataLimite: ['']
    });
  }

  ngOnInit(): void {
    this.carregarFamilias();
    this.demandasService
      .observarDemandas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(demandas => {
        this.todasDemandas = demandas;
        this.atualizarResumo();
        this.recalcularSecoes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  registrarDemanda(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.value as {
      familiaId: number;
      titulo: string;
      descricao: string;
      urgencia: DemandaUrgencia;
      dataLimite: string;
    };

    const payload: CriarDemandaPayload = {
      familiaId: valores.familiaId,
      titulo: valores.titulo,
      descricao: valores.descricao || '',
      urgencia: valores.urgencia,
      dataLimite: valores.dataLimite ? valores.dataLimite : null
    };

    this.demandasService.criarDemanda(payload);
    this.notificationService.showSuccess('Demanda registrada', 'A demanda foi adicionada à fila de acompanhamentos.');
    this.formulario.reset({
      familiaId: null,
      titulo: '',
      descricao: '',
      urgencia: 'Média',
      dataLimite: ''
    });
  }

  aplicarFiltros(): void {
    this.recalcularSecoes();
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroUrgencia = '';
    this.filtroBusca = '';
    this.recalcularSecoes();
  }

  formatarData(data: string | null): string {
    if (!data) {
      return 'Sem data limite';
    }
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) {
      return 'Data inválida';
    }
    return parsed.toLocaleDateString();
  }

  estaAtrasada(demanda: DemandaDetalhada): boolean {
    if (!demanda.dataLimite || demanda.status === 'Concluída') {
      return false;
    }
    const limite = new Date(demanda.dataLimite);
    const hoje = new Date();
    limite.setHours(23, 59, 59, 999);
    return limite.getTime() < hoje.getTime();
  }

  atualizarStatus(demanda: DemandaDetalhada, status: DemandaStatus): void {
    if (demanda.status === status) {
      return;
    }
    this.demandasService.atualizarDemanda(demanda.id, { status });
    const mensagem =
      status === 'Concluída'
        ? 'Demanda marcada como concluída.'
        : status === 'Em andamento'
          ? 'Demanda marcada como em andamento.'
          : 'Demanda reaberta como pendente.';
    this.notificationService.showSuccess('Status atualizado', mensagem);
  }

  removerDemanda(demanda: DemandaDetalhada): void {
    this.demandasService.removerDemanda(demanda.id);
    this.notificationService.showInfo('Demanda removida', 'O registro foi retirado da fila.');
  }

  obterFamiliaNome(familiaId: number): string {
    const familia = this.familias.find(item => item.id === familiaId);
    if (!familia) {
      return 'Família não encontrada';
    }
    return `Família de ${this.obterResponsavel(familia)}`;
  }

  private carregarFamilias(): void {
    this.carregandoFamilias = true;
    this.erroFamilias = '';
    this.familiasService.listarTodasFamilias().pipe(takeUntil(this.destroy$)).subscribe({
      next: familias => {
        this.familias = familias;
        this.carregandoFamilias = false;
        this.recalcularSecoes();
      },
      error: erro => {
        console.error('Erro ao carregar famílias para demandas', erro);
        this.erroFamilias = 'Não foi possível carregar a lista de famílias.';
        this.carregandoFamilias = false;
      }
    });
  }

  private obterResponsavel(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto || 'Responsável não informado';
  }

  private construirDemandaDetalhada(demanda: Demanda): DemandaDetalhada {
    const familia = this.familias.find(item => item.id === demanda.familiaId);
    if (!familia) {
      return {
        ...demanda,
        familiaNome: 'Família não encontrada',
        responsavel: 'Responsável não disponível',
        endereco: 'Endereço não disponível'
      };
    }
    const responsavel = this.obterResponsavel(familia);
    const endereco = familia.enderecoDetalhado
      ? `${familia.enderecoDetalhado.rua}, ${familia.enderecoDetalhado.numero || 's/ nº'} • ${familia.enderecoDetalhado.cidade}/${familia.enderecoDetalhado.uf}`
      : 'Endereço não informado';
    return {
      ...demanda,
      familiaNome: `Família de ${responsavel}`,
      responsavel,
      endereco
    };
  }

  private filtrarDemandas(): DemandaDetalhada[] {
    const buscas = this.filtroBusca.trim().toLowerCase();
    return this.todasDemandas
      .map(demanda => this.construirDemandaDetalhada(demanda))
      .filter(demanda => {
        if (this.filtroStatus && demanda.status !== this.filtroStatus) {
          return false;
        }
        if (this.filtroUrgencia && demanda.urgencia !== this.filtroUrgencia) {
          return false;
        }
        if (!buscas) {
          return true;
        }
        return (
          demanda.titulo.toLowerCase().includes(buscas) ||
          demanda.descricao.toLowerCase().includes(buscas) ||
          demanda.familiaNome.toLowerCase().includes(buscas)
        );
      });
  }

  private recalcularSecoes(): void {
    const filtradas = this.filtrarDemandas();
    const mapearSecao = (status: DemandaStatus): SecaoDemandas => {
      const propriedades = this.propriedadesStatus(status);
      return {
        ...propriedades,
        demandas: filtradas.filter(demanda => demanda.status === status)
      };
    };
    this.secoes = [mapearSecao('Pendente'), mapearSecao('Em andamento'), mapearSecao('Concluída')];
    this.semDemandasFiltradas = filtradas.length === 0;
  }

  private propriedadesStatus(status: DemandaStatus): Omit<SecaoDemandas, 'demandas'> {
    if (status === 'Pendente') {
      return {
        titulo: 'Pendentes',
        descricao: 'Demandas aguardando atendimento inicial.',
        icone: 'M12 8c1.657 0 3-1.79 3-4S13.657 0 12 0 9 1.79 9 4s1.343 4 3 4zm0 2c-2.21 0-4 1.79-4 4v8h8v-8c0-2.21-1.79-4-4-4z',
        cor: 'text-amber-600',
        status
      };
    }
    if (status === 'Em andamento') {
      return {
        titulo: 'Em andamento',
        descricao: 'Demandas que estão sendo tratadas.',
        icone: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1-15h2v6h-2zm0 8h2v2h-2z',
        cor: 'text-blue-600',
        status
      };
    }
    return {
      titulo: 'Concluídas',
      descricao: 'Demandas finalizadas com sucesso.',
      icone: 'M9 16.17L4.83 12 3.41 13.41 9 19l12-12-1.41-1.41z',
      cor: 'text-emerald-600',
      status
    };
  }

  private atualizarResumo(): void {
    const pendentes = this.todasDemandas.filter(demanda => demanda.status === 'Pendente').length;
    const andamento = this.todasDemandas.filter(demanda => demanda.status === 'Em andamento').length;
    const concluidas = this.todasDemandas.filter(demanda => demanda.status === 'Concluída').length;
    this.resumoDemandas = {
      pendentes,
      emAndamento: andamento,
      concluidas
    };
  }
}
