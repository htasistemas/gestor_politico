import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  FamiliasService,
  FamiliaFiltro,
  FamiliaMembroResponse,
  FamiliaResponse
} from '../familias.service';
import {
  LocalidadesService,
  Cidade,
  Regiao
} from '../../shared/services/localidades.service';
import { DESCRICOES_PARENTESCO } from '../parentesco.enum';
import { NotificationService } from '../../shared/services/notification.service';
import { ViaCepService, ViaCepResponse } from '../../shared/services/via-cep.service';

interface RegiaoFiltro extends Regiao {
  cidadeId: number;
  cidadeNome: string;
}

@Component({
  standalone: false,
  selector: 'app-familias-mobile',
  templateUrl: './familias-mobile.component.html',
  styleUrls: ['./familias-mobile.component.css']
})
export class FamiliasMobileComponent implements OnInit, OnDestroy {
  filtroForm: FormGroup;
  familias: FamiliaResponse[] = [];
  destaques: { titulo: string; valor: string; variacao: string; descricao: string }[] = [];
  cidades: Cidade[] = [];
  regioes: RegiaoFiltro[] = [];
  tamanhosPagina: number[] = [5, 10, 20];
  probabilidadesVoto: string[] = ['Alta', 'Média', 'Baixa'];
  readonly descricoesParentesco = DESCRICOES_PARENTESCO;

  carregando = false;
  erroCarregamento = '';
  mostrarFiltros = false;

  paginaAtual = 0;
  tamanhoPagina = 10;
  totalFamilias = 0;
  responsaveisAtivos = 0;
  novosCadastros = 0;

  private todasRegioes: RegiaoFiltro[] = [];
  private readonly regioesPorCidade = new Map<number, RegiaoFiltro[]>();
  private assinaturaRegioes: Subscription | null = null;
  private readonly parceirosEmCriacao = new Set<number>();
  consultandoCep = false;
  erroCepFiltro = '';

  constructor(
    private readonly familiasService: FamiliasService,
    private readonly localidadesService: LocalidadesService,
    private readonly viaCepService: ViaCepService,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly notificationService: NotificationService
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
    this.carregando = true;
    this.localidadesService.listarCidades().subscribe({
      next: cidades => {
        this.cidades = cidades;
        this.carregarRegioesIniciais(cidades);
        this.buscarFamilias();
      },
      error: erro => {
        console.error('Erro ao carregar cidades', erro);
        this.buscarFamilias();
      }
    });
  }

  ngOnDestroy(): void {
    this.assinaturaRegioes?.unsubscribe();
  }

  aplicarFiltros(): void {
    this.paginaAtual = 0;
    this.buscarFamilias();
    this.mostrarFiltros = false;
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
    this.erroCepFiltro = '';
    this.consultandoCep = false;
    this.aplicarFiltros();
  }

  alternarFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
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

  alterarTamanhoPagina(evento: Event): void {
    const valor = Number((evento.target as HTMLSelectElement).value);
    if (Number.isNaN(valor) || valor <= 0) {
      return;
    }
    this.tamanhoPagina = valor;
    this.paginaAtual = 0;
    this.buscarFamilias();
  }

  buscarCepFiltros(): void {
    const cepControl = this.filtroForm.get('cep');
    const valorCep = typeof cepControl?.value === 'string' ? cepControl.value : '';
    const cepNumerico = valorCep.replace(/\D/g, '');

    if (cepNumerico.length !== 8) {
      this.erroCepFiltro = 'Informe um CEP válido com 8 dígitos.';
      return;
    }

    this.consultandoCep = true;
    this.erroCepFiltro = '';

    this.viaCepService.buscarCep(cepNumerico).subscribe({
      next: resposta => {
        this.consultandoCep = false;
        if (!resposta) {
          this.erroCepFiltro = 'CEP não encontrado. Preencha os filtros manualmente.';
          return;
        }
        this.preencherFiltrosComCep(resposta);
      },
      error: () => {
        this.consultandoCep = false;
        this.erroCepFiltro = 'Não foi possível consultar o CEP. Tente novamente.';
      }
    });
  }

  abrirFamilia(familia: FamiliaResponse): void {
    this.router.navigate(['/familias/nova'], {
      queryParams: { familiaId: familia.id }
    });
  }

  get cidadeSelecionadaId(): number | null {
    const valor = this.filtroForm.get('cidadeId')?.value;
    if (valor === null || valor === '') {
      return null;
    }
    const numero = typeof valor === 'string' ? Number(valor) : valor;
    return Number.isNaN(numero) ? null : numero;
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

  obterResponsavel(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto || 'Responsável não informado';
  }

  obterTelefoneResponsavel(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.telefone || 'Sem telefone';
  }

  obterTotalMembros(familia: FamiliaResponse): number {
    return familia.membros.length;
  }

  membrosSecundarios(familia: FamiliaResponse): FamiliaResponse['membros'] {
    return familia.membros.filter(membro => !membro.responsavelPrincipal);
  }

  descricaoParentesco(membro: FamiliaMembroResponse): string {
    if (membro.responsavelPrincipal) {
      return 'Responsável';
    }
    return this.descricoesParentesco[membro.parentesco] ?? 'Parente';
  }

  emProcessoParceiro(membro: FamiliaMembroResponse): boolean {
    return this.parceirosEmCriacao.has(membro.id);
  }

  tornarParceiro(evento: Event, familia: FamiliaResponse, membro: FamiliaMembroResponse): void {
    evento.stopPropagation();
    if (membro.parceiro || this.parceirosEmCriacao.has(membro.id)) {
      return;
    }

    this.parceirosEmCriacao.add(membro.id);
    this.familiasService.tornarMembroParceiro(familia.id, membro.id).subscribe({
      next: atualizado => {
        this.atualizarMembroFamilia(familia, atualizado);
        this.notificationService.showSuccess(
          'Parceiro habilitado!',
          `${atualizado.nomeCompleto} agora pode cadastrar novas famílias.`
        );
      },
      error: () => {
        this.notificationService.showError(
          'Não foi possível gerar o link do parceiro.',
          'Tente novamente em instantes.'
        );
      },
      complete: () => {
        this.parceirosEmCriacao.delete(membro.id);
      }
    });
  }

  private atualizarMembroFamilia(
    familia: FamiliaResponse,
    membroAtualizado: FamiliaMembroResponse
  ): void {
    const indice = familia.membros.findIndex(item => item.id === membroAtualizado.id);
    if (indice === -1) {
      return;
    }

    familia.membros = familia.membros.map((item, posicao) =>
      posicao === indice ? { ...item, ...membroAtualizado } : item
    );
  }

  dataCadastro(familia: FamiliaResponse): string {
    const data = familia.criadoEm ? new Date(familia.criadoEm) : null;
    return data ? data.toLocaleDateString() : 'Data não informada';
  }

  private carregarRegioesIniciais(cidades: Cidade[]): void {
    if (cidades.length === 0) {
      this.regioes = [];
      this.todasRegioes = [];
      return;
    }

    const requisicoes = cidades.map(cidade =>
      this.localidadesService.listarRegioes(cidade.id).pipe(
        catchError(() => of([] as Regiao[]))
      )
    );

    this.assinaturaRegioes = forkJoin(requisicoes).subscribe(respostas => {
      const todas: RegiaoFiltro[] = [];
      respostas.forEach((regioes, indice) => {
        const cidade = cidades[indice];
        regioes.forEach(regiao => {
          todas.push({
            ...regiao,
            cidadeId: cidade.id,
            cidadeNome: cidade.nome
          });
        });
        this.regioesPorCidade.set(
          cidade.id,
          regioes.map(regiao => ({
            ...regiao,
            cidadeId: cidade.id,
            cidadeNome: cidade.nome
          }))
        );
      });
      this.todasRegioes = todas;
      this.regioes = todas;
    });
  }

  private carregarRegioesPorCidade(cidadeId: number): void {
    this.localidadesService.listarRegioes(cidadeId).pipe(
      catchError(() => of([] as Regiao[]))
    ).subscribe(regioes => {
      const adaptadas = regioes.map(regiao => ({
        ...regiao,
        cidadeId,
        cidadeNome: this.obterNomeCidade(cidadeId)
      }));
      this.regioesPorCidade.set(cidadeId, adaptadas);
      if (this.cidadeSelecionadaId === cidadeId) {
        this.regioes = adaptadas;
      }
    });
  }

  private obterNomeCidade(cidadeId: number): string {
    const cidade = this.cidades.find(item => item.id === cidadeId);
    return cidade ? cidade.nome : '';
  }

  private preencherFiltrosComCep(resposta: ViaCepResponse): void {
    const cepResposta = resposta.cep?.trim();
    if (cepResposta) {
      this.filtroForm.patchValue({ cep: this.formatarCep(cepResposta) }, { emitEvent: false });
    }

    const logradouro = resposta.logradouro?.trim();
    if (logradouro) {
      this.filtroForm.patchValue({ rua: logradouro }, { emitEvent: false });
    }

    const bairro = resposta.bairro?.trim();
    if (bairro) {
      this.filtroForm.patchValue({ bairro }, { emitEvent: false });
    }

    const cidadeNome = resposta.localidade?.trim() ?? '';
    const uf = resposta.uf?.trim().toUpperCase() ?? '';

    if (!cidadeNome || !uf) {
      this.notificationService.showWarning(
        'Cidade não identificada pelo CEP consultado.',
        'Informe a cidade manualmente para refinar os filtros.'
      );
      return;
    }

    const cidade = this.encontrarCidadeSimilar(cidadeNome, uf);
    if (!cidade) {
      this.notificationService.showWarning(
        'Cidade não encontrada na base de dados.',
        'Selecione manualmente a cidade correspondente ao CEP.'
      );
      return;
    }

    this.definirCidadeFiltrosPorCep(cidade.id);
  }

  private definirCidadeFiltrosPorCep(cidadeId: number): void {
    this.filtroForm.patchValue({ cidadeId, regiao: '' }, { emitEvent: false });
    const regioesCidade = this.regioesPorCidade.get(cidadeId);
    if (regioesCidade) {
      this.regioes = regioesCidade;
    } else {
      this.regioes = [];
      this.carregarRegioesPorCidade(cidadeId);
    }
  }

  private encontrarCidadeSimilar(nomeCidade: string, uf: string): Cidade | undefined {
    const cidadeNormalizada = this.normalizarTexto(nomeCidade);
    const ufNormalizada = uf.toUpperCase();

    const exata = this.cidades.find(cidade => {
      const mesmoNome = this.normalizarTexto(cidade.nome) === cidadeNormalizada;
      const mesmaUf = cidade.uf.toUpperCase() === ufNormalizada;
      return mesmoNome && mesmaUf;
    });

    if (exata) {
      return exata;
    }

    return this.cidades.find(cidade => {
      if (cidade.uf.toUpperCase() !== ufNormalizada) {
        return false;
      }
      const nomeNormalizado = this.normalizarTexto(cidade.nome);
      return nomeNormalizado.includes(cidadeNormalizada) || cidadeNormalizada.includes(nomeNormalizado);
    });
  }

  private normalizarTexto(valor: string | null | undefined): string {
    if (!valor) {
      return '';
    }
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatarCep(valor: string): string {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 8);
    if (apenasDigitos.length <= 5) {
      return apenasDigitos;
    }
    const prefixo = apenasDigitos.slice(0, 5);
    const sufixo = apenasDigitos.slice(5);
    return `${prefixo}-${sufixo}`;
  }

  private buscarFamilias(): void {
    const filtros = this.montarFiltros();
    this.carregando = true;
    this.erroCarregamento = '';

    this.familiasService.buscarFamilias(filtros, this.paginaAtual, this.tamanhoPagina).subscribe({
      next: resposta => {
        this.familias = resposta.familias;
        this.totalFamilias = resposta.total;
        this.responsaveisAtivos = resposta.responsaveisAtivos ?? 0;
        this.novosCadastros = resposta.novosCadastros ?? 0;
        this.atualizarDestaques();
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.erroCarregamento = 'Não foi possível carregar as famílias.';
      }
    });
  }

  private montarFiltros(): FamiliaFiltro {
    const filtros: FamiliaFiltro = {};

    const registrar = <K extends keyof FamiliaFiltro>(campo: K, valor: unknown) => {
      if (valor === null || valor === undefined) {
        return;
      }
      if (typeof valor === 'string' && valor.trim() === '') {
        return;
      }
      filtros[campo] = valor as FamiliaFiltro[K];
    };

    const valores = this.filtroForm.value;
    registrar('cidadeId', valores.cidadeId ? Number(valores.cidadeId) : null);
    registrar('regiao', valores.regiao);
    registrar('termo', valores.termo);
    registrar('responsavel', valores.responsavel);
    registrar('probabilidadeVoto', valores.probabilidadeVoto);
    registrar('dataInicio', valores.dataInicio);
    registrar('dataFim', valores.dataFim);
    registrar('bairro', valores.bairro);
    registrar('rua', valores.rua);
    registrar('numero', valores.numero);

    if (typeof valores.cep === 'string') {
      const cepSanitizado = valores.cep.replace(/\D/g, '');
      if (cepSanitizado !== '') {
        filtros.cep = cepSanitizado;
      }
    }

    return filtros;
  }

  private atualizarDestaques(): void {
    const totalFamilias = this.totalFamilias;
    const responsaveis = this.responsaveisAtivos;
    const novos = this.novosCadastros;

    this.destaques = [
      {
        titulo: 'Famílias',
        valor: totalFamilias.toString(),
        variacao: totalFamilias > 0 ? `+${totalFamilias}` : '+0',
        descricao: 'Total de famílias cadastradas'
      },
      {
        titulo: 'Responsáveis ativos',
        valor: responsaveis.toString(),
        variacao: responsaveis > 0 ? `+${responsaveis}` : '+0',
        descricao: 'Responsáveis principais com contato ativo'
      },
      {
        titulo: 'Novos cadastros',
        valor: novos.toString(),
        variacao: novos > 0 ? `+${novos}` : '+0',
        descricao: 'Famílias cadastradas recentemente'
      }
    ];
  }
}
