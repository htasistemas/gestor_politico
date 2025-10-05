import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  FamiliasService,
  FamiliaFiltro,
  FamiliaResponse
} from '../familias.service';
import {
  LocalidadesService,
  Cidade,
  Regiao
} from '../../shared/services/localidades.service';

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

  constructor(
    private readonly familiasService: FamiliasService,
    private readonly localidadesService: LocalidadesService,
    private readonly router: Router,
    private readonly fb: FormBuilder
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
    return responsavel?.telefones?.[0]?.numero || 'Sem telefone';
  }

  obterTotalMembros(familia: FamiliaResponse): number {
    return familia.membros.length;
  }

  membrosSecundarios(familia: FamiliaResponse): FamiliaResponse['membros'] {
    return familia.membros.filter(membro => !membro.responsavelPrincipal);
  }

  dataCadastro(familia: FamiliaResponse): string {
    const data = familia.dataCadastro ? new Date(familia.dataCadastro) : null;
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

  private buscarFamilias(): void {
    const filtros = this.montarFiltros();
    this.carregando = true;
    this.erroCarregamento = '';

    this.familiasService.buscarFamilias(filtros, this.paginaAtual, this.tamanhoPagina).subscribe({
      next: resposta => {
        this.familias = resposta.itens;
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
    registrar('cep', valores.cep);

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
