import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

@Component({

  standalone: false,

  selector: 'app-familias',
  templateUrl: './familias.component.html',
  styleUrls: ['./familias.component.css']
})
export class FamiliasComponent implements OnInit {
  destaques: { titulo: string; valor: string; variacao: string; descricao: string }[] = [];
  familias: FamiliaResponse[] = [];
  carregando = false;
  erroCarregamento = '';

  filtroForm: FormGroup;
  cidades: Cidade[] = [];
  regioes: Regiao[] = [];
  probabilidadesVoto: string[] = ['Alta', 'Média', 'Baixa'];
  tamanhosPagina: number[] = [10, 20, 50, 100];

  paginaAtual = 0;
  tamanhoPagina = 20;
  totalFamilias = 0;
  responsaveisAtivos = 0;
  novosCadastros = 0;

  familiaSelecionadaId: number | null = null;
  mostrarFiltrosAvancados = false;

  constructor(
    private readonly familiasService: FamiliasService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly localidadesService: LocalidadesService,
    private readonly router: Router
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
        if (cidades.length > 0) {
          const cidadeId = cidades[0].id;
          this.filtroForm.patchValue({ cidadeId });
          this.carregarRegioes(cidadeId);
        }
        this.buscarFamilias();
      },
      error: erro => {
        console.error('Erro ao carregar cidades', erro);
        this.buscarFamilias();
      }
    });
  }

  alternarFiltrosAvancados(): void {
    this.mostrarFiltrosAvancados = !this.mostrarFiltrosAvancados;
  }

  aplicarFiltros(): void {
    this.paginaAtual = 0;
    this.buscarFamilias();
  }

  limparFiltros(): void {
    const cidadeId = this.filtroForm.get('cidadeId')?.value ?? null;
    this.filtroForm.reset({
      cidadeId,
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
    this.paginaAtual = 0;
    this.buscarFamilias();
  }

  onCidadeChange(valor: string | number | null): void {
    if (valor === null || valor === '') {
      this.filtroForm.patchValue({ cidadeId: null, regiao: '' }, { emitEvent: false });
      this.regioes = [];
      this.aplicarFiltros();
      return;
    }

    const cidadeId = Number(valor);
    if (Number.isNaN(cidadeId)) {
      return;
    }

    this.filtroForm.patchValue({ cidadeId, regiao: '' }, { emitEvent: false });
    this.carregarRegioes(cidadeId);
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
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    if (!responsavel?.telefone) {
      return 'Telefone não informado';
    }
    return responsavel.telefone;
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

        const ultimaPagina = Math.max(this.totalPaginas - 1, 0);
        if (this.familias.length === 0 && this.totalFamilias > 0 && this.paginaAtual > ultimaPagina) {
          this.paginaAtual = ultimaPagina;
          this.buscarFamilias();
          return;
        }

        this.atualizarDestaques();
        this.carregando = false;
      },
      error: erro => {
        console.error('Erro ao carregar famílias', erro);
        this.erroCarregamento = 'Não foi possível carregar as famílias cadastradas.';
        this.carregando = false;
      }
    });
  }

  private carregarRegioes(cidadeId: number | null): void {
    if (cidadeId === null || Number.isNaN(cidadeId)) {
      this.regioes = [];
      return;
    }

    this.localidadesService.listarRegioes(cidadeId).subscribe({
      next: regioes => {
        this.regioes = regioes;
      },
      error: erro => {
        console.error('Erro ao carregar regiões', erro);
        this.regioes = [];
      }
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
    const responsaveisAtivos = this.responsaveisAtivos;
    const novosCadastros = this.novosCadastros;

    this.destaques = [
      {
        titulo: 'Famílias cadastradas',
        valor: totalFamilias.toString(),
        variacao: totalFamilias > 0 ? `+${totalFamilias}` : '+0',
        descricao: 'total registrado na base'
      },
      {
        titulo: 'Responsáveis ativos',
        valor: responsaveisAtivos.toString(),
        variacao: responsaveisAtivos > 0 ? `+${responsaveisAtivos}` : '+0',
        descricao: 'famílias com responsável definido'
      },
      {
        titulo: 'Novos cadastros',
        valor: novosCadastros.toString(),
        variacao: `+${novosCadastros} nesta semana`,
        descricao: 'entradas nos últimos 7 dias'
      }
    ];
  }
}
