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

interface FiltroFamiliaSelecao {
  termo: string;
  cidade: string;
  regiao: string;
  responsavel: string;
  probabilidadeVoto: string;
  dataInicio: string;
  dataFim: string;
  bairro: string;
  rua: string;
  numero: string;
  cep: string;
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
  familiaSelecionada: FamiliaResponse | null = null;
  mostrarModalSelecionarFamilia = false;
  mostrarFiltrosAvancadosFamilias = false;
  filtroFamiliasForm: FormGroup;
  familiasFiltradasBusca: FamiliaResponse[] = [];
  cidadesDisponiveis: string[] = [];
  regioesDisponiveis: string[] = [];
  probabilidadesVoto: string[] = ['Alta', 'Média', 'Baixa'];
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

    this.filtroFamiliasForm = this.fb.group({
      termo: [''],
      cidade: [''],
      regiao: [''],
      responsavel: [''],
      probabilidadeVoto: [''],
      dataInicio: [''],
      dataFim: [''],
      bairro: [''],
      rua: [''],
      numero: [''],
      cep: ['']
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
    this.familiaSelecionada = null;
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

  abrirBuscaFamilias(): void {
    if (this.carregandoFamilias) {
      return;
    }
    this.mostrarModalSelecionarFamilia = true;
    this.aplicarFiltroFamiliasBusca();
  }

  fecharBuscaFamilias(): void {
    this.mostrarModalSelecionarFamilia = false;
  }

  alternarFiltrosFamilias(): void {
    this.mostrarFiltrosAvancadosFamilias = !this.mostrarFiltrosAvancadosFamilias;
  }

  aplicarFiltroFamiliasBusca(): void {
    const filtros = this.filtroFamiliasForm.value as FiltroFamiliaSelecao;
    const filtradas = this.filtrarFamiliasParaSelecao(filtros);
    this.familiasFiltradasBusca = this.ordenarFamilias(filtradas);
  }

  limparFiltroFamiliasBusca(): void {
    this.filtroFamiliasForm.reset({
      termo: '',
      cidade: '',
      regiao: '',
      responsavel: '',
      probabilidadeVoto: '',
      dataInicio: '',
      dataFim: '',
      bairro: '',
      rua: '',
      numero: '',
      cep: ''
    });
    this.aplicarFiltroFamiliasBusca();
  }

  selecionarFamilia(familia: FamiliaResponse): void {
    this.formulario.patchValue({ familiaId: familia.id });
    this.formulario.get('familiaId')?.markAsTouched();
    this.familiaSelecionada = familia;
    this.mostrarModalSelecionarFamilia = false;
  }

  obterIniciaisFamilia(familia: FamiliaResponse): string {
    const responsavel = this.obterResponsavel(familia);
    if (!responsavel) {
      return 'NA';
    }
    const partes = responsavel.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  obterEnderecoResumido(familia: FamiliaResponse): string {
    const endereco = familia.enderecoDetalhado;
    if (!endereco) {
      return 'Endereço não informado';
    }
    const partes: string[] = [];
    if (endereco.rua) {
      partes.push(endereco.rua);
    }
    if (endereco.numero) {
      partes.push(`nº ${endereco.numero}`);
    }
    if (endereco.bairro) {
      partes.push(endereco.bairro);
    }
    const cidadeUf = `${endereco.cidade} / ${endereco.uf}`;
    partes.push(cidadeUf);
    return partes.join(' • ');
  }

  obterProbabilidadeFamilia(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.probabilidadeVoto || 'Não informada';
  }

  obterDataCadastroFamilia(data: string): string {
    if (!data) {
      return 'Não informada';
    }
    const formatada = this.formatarData(data);
    if (formatada === 'Sem data limite' || formatada === 'Data inválida') {
      return 'Não informada';
    }
    return formatada;
  }

  private carregarFamilias(): void {
    this.carregandoFamilias = true;
    this.erroFamilias = '';
    this.familiasService.listarTodasFamilias().pipe(takeUntil(this.destroy$)).subscribe({
      next: familias => {
        this.familias = familias;
        this.carregandoFamilias = false;
        this.atualizarOpcoesFiltroFamilias();
        this.aplicarFiltroFamiliasBusca();
        this.atualizarFamiliaSelecionada();
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

  private atualizarOpcoesFiltroFamilias(): void {
    const cidades = new Set<string>();
    const regioes = new Set<string>();
    this.familias.forEach(familia => {
      const endereco = familia.enderecoDetalhado;
      if (endereco) {
        const cidadeUf = `${endereco.cidade} / ${endereco.uf}`;
        if (cidadeUf.trim()) {
          cidades.add(cidadeUf);
        }
        if (endereco.regiao) {
          regioes.add(endereco.regiao);
        }
      }
    });
    this.cidadesDisponiveis = Array.from(cidades).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    this.regioesDisponiveis = Array.from(regioes).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  private atualizarFamiliaSelecionada(): void {
    const familiaId = this.formulario.get('familiaId')?.value;
    if (familiaId === null || familiaId === undefined) {
      this.familiaSelecionada = null;
      return;
    }
    const familia = this.familias.find(item => item.id === familiaId) || null;
    this.familiaSelecionada = familia;
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

  private filtrarFamiliasParaSelecao(filtros: FiltroFamiliaSelecao): FamiliaResponse[] {
    const termo = this.normalizarTexto(filtros.termo);
    const cidade = this.normalizarTexto(filtros.cidade);
    const regiao = this.normalizarTexto(filtros.regiao);
    const responsavelFiltro = this.normalizarTexto(filtros.responsavel);
    const probabilidade = this.normalizarTexto(filtros.probabilidadeVoto);
    const bairro = this.normalizarTexto(filtros.bairro);
    const rua = this.normalizarTexto(filtros.rua);
    const numero = this.normalizarTexto(filtros.numero);
    const cep = this.normalizarTexto(filtros.cep);
    const dataInicio = filtros.dataInicio ? this.obterDataNoInicioDoDia(filtros.dataInicio) : null;
    const dataFim = filtros.dataFim ? this.obterDataNoFimDoDia(filtros.dataFim) : null;

    return this.familias.filter(familia => {
      const responsavel = this.obterResponsavel(familia);
      const responsavelNormalizado = this.normalizarTexto(responsavel);
      const nomeFamiliaNormalizado = this.normalizarTexto(this.obterFamiliaNome(familia.id));
      const enderecoNormalizado = this.normalizarTexto(familia.endereco);
      const enderecoDetalhado = familia.enderecoDetalhado;
      const bairroFamilia = this.normalizarTexto(familia.bairro || enderecoDetalhado?.bairro || '');
      const ruaFamilia = this.normalizarTexto(enderecoDetalhado?.rua || '');
      const numeroFamilia = this.normalizarTexto(enderecoDetalhado?.numero || '');
      const cepFamilia = this.normalizarTexto(enderecoDetalhado?.cep || '');
      const regiaoFamilia = this.normalizarTexto(enderecoDetalhado?.regiao || '');
      const cidadeFamilia = this.normalizarTexto(
        enderecoDetalhado ? `${enderecoDetalhado.cidade} / ${enderecoDetalhado.uf}` : ''
      );
      const probabilidadeFamilia = this.normalizarTexto(this.obterProbabilidadeFamilia(familia));

      if (termo) {
        const conjunto = [responsavelNormalizado, nomeFamiliaNormalizado, enderecoNormalizado, bairroFamilia, ruaFamilia].join(
          ' '
        );
        if (!conjunto.includes(termo)) {
          return false;
        }
      }

      if (cidade && cidadeFamilia !== cidade) {
        return false;
      }

      if (regiao && regiaoFamilia !== regiao) {
        return false;
      }

      if (responsavelFiltro && !responsavelNormalizado.includes(responsavelFiltro)) {
        return false;
      }

      if (probabilidade && probabilidadeFamilia !== probabilidade) {
        return false;
      }

      if (bairro && !bairroFamilia.includes(bairro)) {
        return false;
      }

      if (rua && !ruaFamilia.includes(rua)) {
        return false;
      }

      if (numero && !numeroFamilia.includes(numero)) {
        return false;
      }

      if (cep && !cepFamilia.includes(cep)) {
        return false;
      }

      if (dataInicio || dataFim) {
        const criadoEm = new Date(familia.criadoEm);
        if (!Number.isNaN(criadoEm.getTime())) {
          if (dataInicio && criadoEm.getTime() < dataInicio.getTime()) {
            return false;
          }
          if (dataFim && criadoEm.getTime() > dataFim.getTime()) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private normalizarTexto(valor: string | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '';
    }
    return valor.toString().trim().toLowerCase();
  }

  private obterDataNoInicioDoDia(valor: string): Date {
    const data = new Date(valor);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  private obterDataNoFimDoDia(valor: string): Date {
    const data = new Date(valor);
    data.setHours(23, 59, 59, 999);
    return data;
  }

  private ordenarFamilias(familias: FamiliaResponse[]): FamiliaResponse[] {
    return [...familias].sort((a, b) => this.obterResponsavel(a).localeCompare(this.obterResponsavel(b), 'pt-BR'));
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
