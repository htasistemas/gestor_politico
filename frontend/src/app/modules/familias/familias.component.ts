import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  FamiliasService,
  FamiliaFiltro,
  FamiliaResponse
} from './familias.service';
import {
  LocalidadesService,
  Cidade,
  Regiao
} from '../shared/services/localidades.service';

import { NotificationService } from '../shared/services/notification.service';

import { DemandasService, Demanda } from '../shared/services/demandas.service';

type RegiaoFiltro = Regiao & { cidadeId: number; cidadeNome: string };

@Component({

  standalone: false,

  selector: 'app-familias',
  templateUrl: './familias.component.html',
  styleUrls: ['./familias.component.css']
})
export class FamiliasComponent implements OnInit, OnDestroy {
  destaques: { titulo: string; valor: string; variacao: string; descricao: string }[] = [];
  familias: FamiliaResponse[] = [];
  carregando = false;
  erroCarregamento = '';

  filtroForm: FormGroup;
  cidades: Cidade[] = [];
  regioes: RegiaoFiltro[] = [];
  probabilidadesVoto: string[] = ['Alta', 'Média', 'Baixa'];
  tamanhosPagina: number[] = [10, 20, 50, 100];

  paginaAtual = 0;
  tamanhoPagina = 20;
  totalFamilias = 0;
  responsaveisAtivos = 0;
  novosCadastros = 0;
  totalPessoas = 0;
  novasPessoasSemana = 0;

  familiaSelecionadaId: number | null = null;
  mostrarFiltrosAvancados = false;
  whatsappCarregandoId: number | null = null;
  private todasRegioes: RegiaoFiltro[] = [];
  private readonly regioesPorCidade = new Map<number, RegiaoFiltro[]>();
  private readonly destroy$ = new Subject<void>();
  private demandasAbertas = new Map<number, number>();

  constructor(
    private readonly familiasService: FamiliasService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly localidadesService: LocalidadesService,
    private readonly router: Router,

    private readonly notificationService: NotificationService

    private readonly demandasService: DemandasService

  ) {
    this.filtroForm = this.fb.group({
      cidadeId: [null],
      regiao: [''],
      termo: [''],
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
    this.demandasService
      .observarDemandas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(demandas => this.atualizarDemandasAbertas(demandas));

    const familiaIdParam = this.route.snapshot.queryParamMap.get('familiaId');
    if (familiaIdParam) {
      const id = Number(familiaIdParam);
      if (!Number.isNaN(id)) {
        this.familiaSelecionadaId = id;
      }
    }

    this.localidadesService.listarCidades().subscribe({
      next: cidades => {
        this.cidades = cidades;
        this.carregarRegioesIniciais(cidades);
        this.buscarFamilias();
      },
      error: _erro => {
        this.notificationService.showError(
          'Erro ao carregar cidades',
          'Não foi possível carregar a lista de cidades. Tente novamente mais tarde.'
        );
        this.buscarFamilias();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  alternarFiltrosAvancados(): void {
    this.mostrarFiltrosAvancados = !this.mostrarFiltrosAvancados;
  }

  aplicarFiltros(): void {
    this.paginaAtual = 0;
    this.buscarFamilias();
  }

  limparFiltros(): void {
    this.filtroForm.reset({
      cidadeId: null,
      regiao: '',
      termo: '',
      responsavel: '',
      probabilidadeVoto: '',
      dataInicio: '',
      dataFim: '',
      bairro: '',
      rua: '',
      numero: '',
      cep: ''
    });
    this.regioes = this.todasRegioes;
    this.paginaAtual = 0;
    this.buscarFamilias();
  }

  onCidadeChange(valor: string | number | null): void {
    if (valor === null || valor === '') {
      this.filtroForm.patchValue({ cidadeId: null, regiao: '' }, { emitEvent: false });
      this.regioes = this.todasRegioes;
      this.aplicarFiltros();
      return;
    }

    const cidadeId = Number(valor);
    if (Number.isNaN(cidadeId)) {
      return;
    }

    this.filtroForm.patchValue({ cidadeId, regiao: '' }, { emitEvent: false });
    const regioesCidade = this.regioesPorCidade.get(cidadeId);
    if (regioesCidade) {
      this.regioes = regioesCidade;
    } else {
      this.regioes = [];
      this.carregarRegioesPorCidade(cidadeId);
    }
    this.aplicarFiltros();
  }

  alterarPagina(delta: number): void {
    const novaPagina = this.paginaAtual + delta;
    if (novaPagina < 0 || novaPagina >= this.totalPaginas) {
      return;
    }
    this.paginaAtual = novaPagina;
    this.buscarFamilias();
  }

  abrirFamilia(familia: FamiliaResponse): void {
    this.familiaSelecionadaId = familia.id;
    this.router.navigate(['/familias/nova'], {
      queryParams: { familiaId: familia.id }
    });
  }

  alterarTamanhoPagina(evento: Event): void {
    const valor = Number((evento.target as HTMLSelectElement).value);
    if (Number.isNaN(valor) || valor <= 0) {
      return;
    }
    this.tamanhoPagina = valor;
    this.paginaAtual = 0;
    this.buscarFamilias();
  }

  get totalPaginas(): number {
    if (this.tamanhoPagina <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.totalFamilias / this.tamanhoPagina));
  }

  get inicioIntervalo(): number {
    if (this.totalFamilias === 0) {
      return 0;
    }
    return this.paginaAtual * this.tamanhoPagina + 1;
  }

  get fimIntervalo(): number {
    if (this.totalFamilias === 0) {
      return 0;
    }
    return Math.min(this.totalFamilias, this.inicioIntervalo + this.familias.length - 1);
  }

  get cidadeSelecionadaId(): number | null {
    const valor = this.filtroForm.get('cidadeId')?.value;
    if (valor === null || valor === '') {
      return null;
    }
    const numero = typeof valor === 'string' ? Number(valor) : valor;
    return Number.isNaN(numero) ? null : numero;
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

  obterTelefoneResponsavel(familia: FamiliaResponse): string {
    const responsavel = this.encontrarResponsavelPrincipal(familia);
    if (!responsavel?.telefone) {
      return 'Telefone não informado';
    }
    return this.formatarTelefone(responsavel.telefone);
  }

  possuiTelefoneResponsavel(familia: FamiliaResponse): boolean {
    const responsavel = this.encontrarResponsavelPrincipal(familia);
    return Boolean(responsavel?.telefone);
  }

  abrirWhatsapp(evento: MouseEvent, familia: FamiliaResponse): void {
    evento.stopPropagation();
    const responsavel = this.encontrarResponsavelPrincipal(familia);
    if (!responsavel?.telefone || this.whatsappCarregandoId === familia.id) {
      return;
    }

    this.whatsappCarregandoId = familia.id;
    const linkWhatsapp = this.montarLinkWhatsapp(responsavel.telefone);

    setTimeout(() => {
      window.open(linkWhatsapp, '_blank', 'noopener');
      this.whatsappCarregandoId = null;
    }, 300);
  }

  contarDemandasPendentes(familia: FamiliaResponse): number {
    return this.demandasAbertas.get(familia.id) ?? 0;
  }

  temDemandasPendentes(familia: FamiliaResponse): boolean {
    return this.contarDemandasPendentes(familia) > 0;
  }

  obterTotalMembros(familia: FamiliaResponse): number {
    return familia.membros.length;
  }

  contarMembrosPorProbabilidade(
    familia: FamiliaResponse,
    probabilidade: 'Alta' | 'Média' | 'Baixa'
  ): number {
    return familia.membros.filter(membro => membro.probabilidadeVoto === probabilidade).length;
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

  private buscarFamilias(): void {
    this.carregando = true;
    this.erroCarregamento = '';
    const filtros = this.montarFiltros();
    this.familiasService.buscarFamilias(filtros, this.paginaAtual, this.tamanhoPagina).subscribe({
      next: resposta => {
        this.familias = resposta.familias;
        this.totalFamilias = resposta.total;
        this.responsaveisAtivos = resposta.responsaveisAtivos;
        this.novosCadastros = resposta.novosCadastros;
        this.totalPessoas = resposta.totalPessoas;
        this.novasPessoasSemana = resposta.novasPessoasSemana;

        const ultimaPagina = Math.max(this.totalPaginas - 1, 0);
        if (this.familias.length === 0 && this.totalFamilias > 0 && this.paginaAtual > ultimaPagina) {
          this.paginaAtual = ultimaPagina;
          this.buscarFamilias();
          return;
        }

        this.atualizarDestaques();
        this.carregando = false;
      },
      error: _erro => {
        this.notificationService.showError(
          'Erro ao carregar famílias',
          'Não foi possível carregar as famílias cadastradas. Tente novamente.'
        );
        this.erroCarregamento = 'Não foi possível carregar as famílias cadastradas.';
        this.carregando = false;
      }
    });
  }

  private carregarRegioesIniciais(cidades: Cidade[]): void {
    if (cidades.length === 0) {
      this.todasRegioes = [];
      this.regioesPorCidade.clear();
      this.regioes = [];
      return;
    }

    const requisicoes = cidades.map(cidade =>
      this.localidadesService.listarRegioes(cidade.id).pipe(
        catchError(_erro => {
          this.notificationService.showError(
            'Erro ao carregar regiões',
            `Não foi possível carregar as regiões da cidade ${cidade.nome}.`
          );
          return of<Regiao[]>([]);
        })
      )
    );

    forkJoin(requisicoes).subscribe(resultados => {
      this.regioesPorCidade.clear();
      resultados.forEach((lista, indice) => {
        const cidade = cidades[indice];
        const mapeadas = this.ordenarRegioes(this.mapearRegioesComCidade(cidade, lista));
        this.regioesPorCidade.set(cidade.id, mapeadas);
      });
      this.atualizarTodasRegioesDisponiveis();
      this.regioes = this.todasRegioes;
    });
  }

  private atualizarDemandasAbertas(demandas: Demanda[]): void {
    const mapa = new Map<number, number>();
    demandas.forEach(demanda => {
      if (demanda.status === 'Concluída') {
        return;
      }
      const total = mapa.get(demanda.familiaId) ?? 0;
      mapa.set(demanda.familiaId, total + 1);
    });
    this.demandasAbertas = mapa;
  }

  private carregarRegioesPorCidade(cidadeId: number): void {
    const cidade = this.cidades.find(item => item.id === cidadeId);
    if (!cidade) {
      this.regioes = [];
      return;
    }

    this.localidadesService
      .listarRegioes(cidadeId)
      .pipe(
        catchError(_erro => {
          this.notificationService.showError(
            'Erro ao carregar regiões',
            `Não foi possível carregar as regiões da cidade ${cidade.nome}.`
          );
          return of<Regiao[]>([]);
        })
      )
      .subscribe(regioes => {
        const mapeadas = this.ordenarRegioes(this.mapearRegioesComCidade(cidade, regioes));
        this.regioesPorCidade.set(cidadeId, mapeadas);
        this.atualizarTodasRegioesDisponiveis();
        if (this.cidadeSelecionadaId === cidadeId) {
          this.regioes = mapeadas;
        }
      });
  }

  private mapearRegioesComCidade(cidade: Cidade, regioes: Regiao[]): RegiaoFiltro[] {
    const cidadeNome = `${cidade.nome} / ${cidade.uf}`;
    return regioes.map(regiao => ({
      ...regiao,
      cidadeId: cidade.id,
      cidadeNome
    }));
  }

  private atualizarTodasRegioesDisponiveis(): void {
    const todas: RegiaoFiltro[] = [];
    this.regioesPorCidade.forEach(lista => {
      todas.push(...lista);
    });
    this.todasRegioes = this.ordenarRegioes(todas);
  }

  private ordenarRegioes(regioes: RegiaoFiltro[]): RegiaoFiltro[] {
    return [...regioes].sort((a, b) => {
      const comparacaoNome = a.nome.localeCompare(b.nome, 'pt-BR');
      if (comparacaoNome !== 0) {
        return comparacaoNome;
      }
      return a.cidadeNome.localeCompare(b.cidadeNome, 'pt-BR');
    });
  }

  private montarFiltros(): FamiliaFiltro {
    const valores = this.filtroForm.value;
    const filtros: FamiliaFiltro = {};

    const cidadeId = valores.cidadeId !== null && valores.cidadeId !== '' ? Number(valores.cidadeId) : null;
    if (cidadeId !== null && !Number.isNaN(cidadeId)) {
      filtros.cidadeId = cidadeId;
    }

    const registrar = <K extends keyof FamiliaFiltro>(campo: K, valor: unknown) => {
      if (typeof valor === 'string') {
        const texto = valor.trim();
        if (texto !== '') {
          filtros[campo] = texto as FamiliaFiltro[K];
        }
      }
    };

    registrar('regiao', valores.regiao);
    registrar('termo', valores.termo);
    registrar('responsavel', valores.responsavel);
    registrar('probabilidadeVoto', valores.probabilidadeVoto);
    registrar('bairro', valores.bairro);
    registrar('rua', valores.rua);
    registrar('numero', valores.numero);

    if (typeof valores.cep === 'string') {
      const cepSanitizado = valores.cep.replace(/\D/g, '');
      if (cepSanitizado !== '') {
        filtros.cep = cepSanitizado;
      }
    }

    if (typeof valores.dataInicio === 'string' && valores.dataInicio.trim() !== '') {
      filtros.dataInicio = valores.dataInicio;
    }

    if (typeof valores.dataFim === 'string' && valores.dataFim.trim() !== '') {
      filtros.dataFim = valores.dataFim;
    }

    return filtros;
  }

  private atualizarDestaques(): void {
    const totalFamilias = this.totalFamilias;
    const totalPessoas = this.totalPessoas;
    const novosCadastros = this.novosCadastros;
    const novasPessoasSemana = this.novasPessoasSemana;

    this.destaques = [
      {
        titulo: 'Famílias cadastradas',
        valor: totalFamilias.toString(),
        variacao: totalFamilias > 0 ? `+${totalFamilias}` : '+0',
        descricao: 'total registrado na base'
      },
      {
        titulo: 'Pessoas cadastradas',
        valor: totalPessoas.toString(),
        variacao: totalPessoas > 0 ? `+${totalPessoas}` : '+0',
        descricao: 'membros distribuídos nas famílias'
      },
      {
        titulo: 'Novas famílias na semana',
        valor: novosCadastros.toString(),
        variacao: `+${novosCadastros} nesta semana`,
        descricao: 'entradas de núcleos familiares'
      },
      {
        titulo: 'Novas pessoas na semana',
        valor: novasPessoasSemana.toString(),
        variacao: `+${novasPessoasSemana} nesta semana`,
        descricao: 'membros adicionados nos últimos 7 dias'
      }
    ];
  }

  private encontrarResponsavelPrincipal(familia: FamiliaResponse) {
    return familia.membros.find(membro => membro.responsavelPrincipal);
  }

  private formatarTelefone(telefone: string): string {
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length < 10) {
      return telefone;
    }

    const ddd = digitos.substring(0, 2);
    if (digitos.length >= 11) {
      const primeiraParte = digitos.substring(2, 7);
      const segundaParte = digitos.substring(7, 11);
      return `(${ddd}) ${primeiraParte}-${segundaParte}`;
    }

    const primeiraParte = digitos.substring(2, 6);
    const segundaParte = digitos.substring(6, 10);
    return `(${ddd}) ${primeiraParte}-${segundaParte}`;
  }

  private montarLinkWhatsapp(telefone: string): string {
    const digitos = telefone.replace(/\D/g, '');
    const numeroComDdi = digitos.startsWith('55') ? digitos : `55${digitos}`;
    return `https://wa.me/${numeroComDdi}`;
  }
}
