import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { FamiliasService, FamiliaMembroPayload, FamiliaPayload, FamiliaResponse } from '../familias.service';
import { DESCRICOES_PARENTESCO, GrauParentesco } from '../parentesco.enum';
import { Bairro, Cidade, LocalidadesService, Regiao } from '../../shared/services/localidades.service';
import { ViaCepResponse, ViaCepService } from '../../shared/services/via-cep.service';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

const VALOR_NOVA_REGIAO = '__nova__';
const VALOR_NOVO_BAIRRO = '__novo__';
type ProbabilidadeVoto = 'Alta' | 'Média' | 'Baixa' | '';

const PARENTESCO_RESPONSAVEL: GrauParentesco = GrauParentesco.RESPONSAVEL;

interface MembroFamiliaForm {
  nome: string;
  nascimento: string;
  profissao: string;
  parentesco: GrauParentesco | '';
  responsavel: boolean;
  probabilidade: ProbabilidadeVoto;
  telefone: string;
}

interface PreviaMembro {
  nome: string;
  idade: number | null;
  profissao: string;
  parentesco: string;
  responsavel: boolean;
  probabilidade: ProbabilidadeVoto;
  telefone: string;
}

interface FamiliaEnderecoForm {
  cep: string;
  rua: string;
  numero: string;
  cidadeId: number | null;
  regiaoSelecionada: string | null;
  novaRegiao: string;
  bairroSelecionado: string | null;
  novoBairro: string;
  regiaoBloqueada: boolean;
  atualizandoRegiao: boolean;
  carregandoCep: boolean;
  erroCep: string | null;
  regioes: Regiao[];
  bairros: Bairro[];
}

interface PreviaFamilia {
  responsavelPrincipal: string;
  enderecoCompleto: string;
  bairro: string;
  regiao: string;
  cidade: string;
  cep: string;
  membros: PreviaMembro[];
}

@Component({
  standalone: false,
  selector: 'app-nova-familia',
  templateUrl: './nova-familia.component.html',
  styleUrls: ['./nova-familia.component.css']
})
export class NovaFamiliaComponent implements OnInit {
  readonly valorNovaRegiao = VALOR_NOVA_REGIAO;
  readonly valorNovoBairro = VALOR_NOVO_BAIRRO;
  readonly ehAdministrador: boolean;

  modoEdicao = false;
  familiaIdEdicao: number | null = null;
  familiaCarregada: FamiliaResponse | null = null;
  carregandoFamilia = false;

  enderecoFamilia: FamiliaEnderecoForm = this.criarEnderecoFamilia();
  novaRegiaoGeradaPorCep = false;
  novoBairroGeradoPorCep = false;

  cidades: Cidade[] = [];
  private readonly regioesCache = new Map<number, Regiao[]>();
  private readonly bairrosCache = new Map<number, Bairro[]>();

  readonly descricoesParentesco = DESCRICOES_PARENTESCO;
  readonly parentescoResponsavel = PARENTESCO_RESPONSAVEL;

  grausParentesco: GrauParentesco[] = [
    GrauParentesco.PAI,
    GrauParentesco.MAE,
    GrauParentesco.FILHO_A,
    GrauParentesco.FILHA,
    GrauParentesco.FILHO,
    GrauParentesco.IRMAO_A,
    GrauParentesco.PRIMO_A,
    GrauParentesco.TIO_A,
    GrauParentesco.SOBRINHO_A,
    GrauParentesco.CONJUGE,
    GrauParentesco.AVO_O,
    GrauParentesco.ENTEADO_A,
    GrauParentesco.OUTRO
  ];

  membros: MembroFamiliaForm[];

  mostrarPrevia = false;
  previaFamilia: PreviaFamilia | null = null;
  salvandoFamilia = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly familiasService: FamiliasService,
    private readonly localidadesService: LocalidadesService,
    private readonly viaCepService: ViaCepService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {
    this.ehAdministrador = this.authService.ehAdministrador();
    this.membros = [this.criarMembro(true)];
  }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([parametros, queryParams]) => {
      const familiaIdParam =
        parametros.get('id') ?? parametros.get('familiaId') ?? queryParams.get('familiaId');
      this.atualizarModoPorParametro(familiaIdParam);
    });

    this.localidadesService.listarCidades().subscribe(cidades => {
      this.cidades = cidades;
      if (this.modoEdicao) {
        this.aplicarFamiliaCarregada();
        return;
      }
      this.aplicarCidadePadraoQuandoDisponivel();
    });
  }

  get tituloPagina(): string {
    return this.modoEdicao ? 'Editar Família' : 'Nova Família';
  }

  get descricaoPagina(): string {
    return this.modoEdicao ? 'Atualização de família e membros' : 'Cadastro de família e membros';
  }

  get textoBotaoPrincipal(): string {
    return this.modoEdicao ? 'Atualizar Família' : 'Cadastrar Família';
  }

  private atualizarModoPorParametro(familiaIdParam: string | null): void {
    if (!familiaIdParam) {
      if (this.modoEdicao) {
        this.modoEdicao = false;
        this.familiaIdEdicao = null;
        this.familiaCarregada = null;
        this.carregandoFamilia = false;
      }
      this.resetarFormularioParaCriacao();
      this.aplicarCidadePadraoQuandoDisponivel();
      return;
    }

    const id = Number(familiaIdParam);
    if (!Number.isFinite(id) || Number.isNaN(id) || id <= 0) {
      this.modoEdicao = false;
      this.familiaIdEdicao = null;
      this.familiaCarregada = null;
      this.carregandoFamilia = false;
      this.resetarFormularioParaCriacao();
      this.aplicarCidadePadraoQuandoDisponivel();
      return;
    }

    if (this.modoEdicao && this.familiaIdEdicao === id) {
      return;
    }

    this.modoEdicao = true;
    this.familiaIdEdicao = id;
    this.familiaCarregada = null;
    this.carregandoFamilia = true;
    this.resetarFormularioParaCriacao();
    this.carregarFamilia(id);
  }

  private aplicarCidadePadraoQuandoDisponivel(): void {
    if (this.modoEdicao) {
      return;
    }

    if (this.enderecoFamilia.cidadeId !== null) {
      return;
    }

    const cidadePadrao = this.cidades.length > 0 ? this.cidades[0].id : null;
    if (cidadePadrao !== null) {
      this.aoAlterarCidadeFamilia(cidadePadrao);
    }
  }

  private carregarFamilia(id: number): void {
    this.carregandoFamilia = true;
    this.familiasService.obterFamilia(id).subscribe({
      next: familia => {
        this.carregandoFamilia = false;
        this.familiaCarregada = familia;
        this.aplicarFamiliaCarregada();
      },
      error: () => {
        this.carregandoFamilia = false;
        this.notificationService.showError(
          'Não foi possível carregar os dados da família selecionada.',
          'Tente novamente.'
        );
        this.router.navigate(['/familias']);
      }
    });
  }

  private aplicarFamiliaCarregada(): void {
    if (!this.familiaCarregada || this.cidades.length === 0) {
      return;
    }

    const endereco = this.familiaCarregada.enderecoDetalhado;
    const base = this.criarEnderecoFamilia();
    this.enderecoFamilia = {
      ...base,
      cep: endereco.cep ?? '',
      rua: endereco.rua ?? '',
      numero: endereco.numero ?? ''
    };
    this.novaRegiaoGeradaPorCep = false;
    this.novoBairroGeradoPorCep = false;

    const cidadeNome = endereco.cidade ?? '';
    const uf = endereco.uf ?? '';
    const cidade = cidadeNome && uf ? this.encontrarCidadeSimilar(cidadeNome, uf) : undefined;

    if (cidade) {
      this.definirCidadeFamilia(cidade.id);
      this.enderecoFamilia.cep = endereco.cep ?? '';
      this.enderecoFamilia.rua = endereco.rua ?? '';
      this.enderecoFamilia.numero = endereco.numero ?? '';

      const regiaoServidor = endereco.regiao ?? null;
      this.carregarRegioesFamilia(cidade.id, () => {
        if (regiaoServidor) {
          const regiaoNormalizada = this.normalizarTexto(regiaoServidor);
          const regiaoEncontrada = this.enderecoFamilia.regioes.find(
            item => this.normalizarTexto(item.nome) === regiaoNormalizada
          );

          if (regiaoEncontrada) {
            this.enderecoFamilia.regiaoSelecionada = regiaoEncontrada.nome;
            this.enderecoFamilia.regiaoBloqueada = true;
          } else {
            this.enderecoFamilia.regiaoSelecionada = this.valorNovaRegiao;
            this.enderecoFamilia.novaRegiao = regiaoServidor;
            this.enderecoFamilia.regiaoBloqueada = false;
          }
        } else {
          this.enderecoFamilia.regiaoSelecionada = null;
          this.enderecoFamilia.regiaoBloqueada = false;
        }

        this.carregarBairrosFamilia(cidade.id, () => {
          this.definirBairroFamiliaPorNome(endereco.bairro ?? undefined);
        });
      });
    }

    this.preencherMembrosFamilia(this.familiaCarregada.membros);
    this.mostrarPrevia = false;
    this.previaFamilia = null;
  }

  private preencherMembrosFamilia(membrosResposta: FamiliaResponse['membros']): void {
    if (!membrosResposta || membrosResposta.length === 0) {
      this.membros = [this.criarMembro(true)];
      return;
    }

    this.membros = membrosResposta.map(membro => {
      const probabilidade = (membro.probabilidadeVoto as ProbabilidadeVoto) || '';
      return {
        nome: membro.nomeCompleto,
        nascimento: membro.dataNascimento ?? '',
        profissao: membro.profissao ?? '',
        parentesco: membro.responsavelPrincipal ? PARENTESCO_RESPONSAVEL : membro.parentesco,
        responsavel: Boolean(membro.responsavelPrincipal),
        probabilidade,
        telefone: this.aplicarMascaraTelefone(membro.telefone ?? '')
      };
    });

    const possuiResponsavel = this.membros.some(membro => membro.responsavel);
    if (!possuiResponsavel && this.membros.length > 0) {
      this.membros[0].responsavel = true;
      this.membros[0].parentesco = PARENTESCO_RESPONSAVEL;
    }
  }

  private resetarFormularioParaCriacao(): void {
    this.enderecoFamilia = this.criarEnderecoFamilia();
    this.membros = [this.criarMembro(true)];
    this.mostrarPrevia = false;
    this.previaFamilia = null;
    this.novaRegiaoGeradaPorCep = false;
    this.novoBairroGeradoPorCep = false;
  }

  voltarPagina(): void {
    this.router.navigate(['/familias']);
  }

  cancelarCadastro(): void {
    this.router.navigate(['/familias']);
  }

  adicionarMembro(): void {
    this.membros.push(this.criarMembro(false));
  }

  removerMembro(indice: number): void {
    if (indice === 0 || this.membros.length <= 1) {
      window.alert('É necessário manter pelo menos um responsável cadastrado.');
      return;
    }

    this.membros.splice(indice, 1);
    if (!this.membros.some(membro => membro.responsavel)) {
      this.membros[0].responsavel = true;
      this.membros[0].parentesco = PARENTESCO_RESPONSAVEL;
    }
  }

  definirResponsavel(indice: number, selecionado: boolean): void {
    if (selecionado) {
      this.membros = this.membros.map((membro, posicao) => {
        const responsavel = posicao === indice;
        return {
          ...membro,
          responsavel,
          parentesco: responsavel
            ? PARENTESCO_RESPONSAVEL
            : membro.parentesco === PARENTESCO_RESPONSAVEL
              ? ''
              : membro.parentesco
        };
      });
      return;
    }

    const existeOutroResponsavel = this.membros.some((membro, posicao) => posicao !== indice && membro.responsavel);
    if (!existeOutroResponsavel) {
      window.alert('A família precisa ter um responsável principal.');
      this.membros[indice].responsavel = true;
      this.membros[indice].parentesco = PARENTESCO_RESPONSAVEL;
      return;
    }

    this.membros[indice].responsavel = false;
    if (this.membros[indice].parentesco === PARENTESCO_RESPONSAVEL) {
      this.membros[indice].parentesco = '';
    }
  }

  aoAlterarCepFamilia(valor: string): void {
    if (typeof valor !== 'string') {
      this.enderecoFamilia.cep = '';
      return;
    }

    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 8);

    if (apenasDigitos.length <= 5) {
      this.enderecoFamilia.cep = apenasDigitos;
      return;
    }

    const prefixo = apenasDigitos.slice(0, 5);
    const sufixo = apenasDigitos.slice(5);
    this.enderecoFamilia.cep = `${prefixo}-${sufixo}`;
  }

  aoAlterarCidadeFamilia(cidadeId: number | null): void {
    if (cidadeId === null) {
      this.enderecoFamilia.cidadeId = null;
      this.enderecoFamilia.regioes = [];
      this.enderecoFamilia.bairros = [];
      this.enderecoFamilia.regiaoSelecionada = null;
      this.enderecoFamilia.novaRegiao = '';
      this.enderecoFamilia.bairroSelecionado = null;
      this.enderecoFamilia.novoBairro = '';
      this.enderecoFamilia.regiaoBloqueada = false;
      this.enderecoFamilia.atualizandoRegiao = false;
      this.novaRegiaoGeradaPorCep = false;
      this.novoBairroGeradoPorCep = false;
      return;
    }

    this.definirCidadeFamilia(cidadeId);
  }

  aoAlterarRegiaoFamilia(valor: string | null): void {
    if (this.enderecoFamilia.regiaoBloqueada) {
      this.enderecoFamilia.regiaoSelecionada = this.obterRegiaoAtualDoBairro();
      return;
    }

    this.enderecoFamilia.regiaoSelecionada = valor && valor !== '' ? valor : null;

    if (!this.enderecoFamilia.regiaoSelecionada) {
      this.enderecoFamilia.novaRegiao = '';
      return;
    }

    if (this.enderecoFamilia.regiaoSelecionada === this.valorNovaRegiao) {
      if (!this.ehAdministrador && !this.novaRegiaoGeradaPorCep) {
        window.alert(
          'A criação de novas regiões está restrita a administradores ou ao preenchimento automático pelo CEP.'
        );
        this.enderecoFamilia.regiaoSelecionada = null;
        return;
      }
      this.enderecoFamilia.novaRegiao = '';
      return;
    }

    this.enderecoFamilia.novaRegiao = '';
    if (
      this.enderecoFamilia.bairroSelecionado &&
      this.enderecoFamilia.bairroSelecionado !== this.valorNovoBairro
    ) {
      this.vincularBairroARegiao(this.enderecoFamilia.regiaoSelecionada);
    }
  }

  aoAlterarBairroFamilia(valor: string | null): void {
    this.enderecoFamilia.bairroSelecionado = valor && valor !== '' ? valor : null;
    this.enderecoFamilia.atualizandoRegiao = false;

    if (this.enderecoFamilia.bairroSelecionado === this.valorNovoBairro) {
      if (!this.ehAdministrador && !this.novoBairroGeradoPorCep) {
        window.alert(
          'A criação de novos bairros está restrita a administradores ou ao preenchimento automático pelo CEP.'
        );
        this.enderecoFamilia.bairroSelecionado = null;
        return;
      }
      this.enderecoFamilia.novoBairro = '';
      this.enderecoFamilia.regiaoSelecionada = null;
      this.enderecoFamilia.regiaoBloqueada = false;
      this.enderecoFamilia.novaRegiao = '';
      return;
    }

    if (!this.enderecoFamilia.bairroSelecionado) {
      this.enderecoFamilia.novoBairro = '';
      this.enderecoFamilia.regiaoSelecionada = null;
      this.enderecoFamilia.regiaoBloqueada = false;
      this.enderecoFamilia.novaRegiao = '';
      return;
    }

    const bairroSelecionado = this.obterBairroSelecionado();
    this.enderecoFamilia.novoBairro = '';
    this.novoBairroGeradoPorCep = false;

    if (bairroSelecionado?.regiao) {
      this.enderecoFamilia.regiaoSelecionada = bairroSelecionado.regiao;
      this.enderecoFamilia.regiaoBloqueada = true;
      this.enderecoFamilia.novaRegiao = '';
    } else {
      this.enderecoFamilia.regiaoSelecionada = null;
      this.enderecoFamilia.regiaoBloqueada = false;
      this.enderecoFamilia.novaRegiao = '';
    }
  }

  buscarCepFamilia(): void {
    const cepLimpo = this.enderecoFamilia.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      this.enderecoFamilia.erroCep = 'Informe um CEP válido com 8 dígitos.';
      return;
    }

    this.enderecoFamilia.carregandoCep = true;
    this.enderecoFamilia.erroCep = null;
    this.viaCepService.buscarCep(cepLimpo).subscribe({
      next: resposta => {
        this.enderecoFamilia.carregandoCep = false;
        if (!resposta) {
          this.enderecoFamilia.erroCep = 'CEP não encontrado. Preencha os dados manualmente.';
          return;
      }
      this.aplicarDadosViaCepFamilia(resposta);
    },
    error: () => {
      this.enderecoFamilia.carregandoCep = false;
      this.enderecoFamilia.erroCep = 'Não foi possível consultar o CEP. Tente novamente.';
    }
  });
}

  private definirCidadeFamilia(cidadeId: number): void {
    this.enderecoFamilia.cidadeId = cidadeId;
    this.enderecoFamilia.regioes = [];
    this.enderecoFamilia.bairros = [];
    this.enderecoFamilia.regiaoSelecionada = null;
    this.enderecoFamilia.novaRegiao = '';
    this.enderecoFamilia.bairroSelecionado = null;
    this.enderecoFamilia.novoBairro = '';
    this.enderecoFamilia.regiaoBloqueada = false;
    this.enderecoFamilia.atualizandoRegiao = false;
    this.novaRegiaoGeradaPorCep = false;
    this.novoBairroGeradoPorCep = false;
    this.carregarRegioesFamilia(cidadeId);
    this.carregarBairrosFamilia(cidadeId);
  }

  private aplicarDadosViaCepFamilia(resposta: ViaCepResponse): void {
    if (resposta.cep) {
      this.enderecoFamilia.cep = resposta.cep;
    }
    if (resposta.logradouro) {
      this.enderecoFamilia.rua = resposta.logradouro;
    }

    this.enderecoFamilia.erroCep = null;

    const nomeCidade = resposta.localidade?.trim() ?? '';
    const uf = resposta.uf?.trim().toUpperCase() ?? '';

    if (!nomeCidade || !uf) {
      this.enderecoFamilia.erroCep = 'Cidade ou UF não informados pelo CEP consultado.';
      return;
    }

    const cidadeSimilar = this.encontrarCidadeSimilar(nomeCidade, uf);
    if (cidadeSimilar) {
      this.aplicarCidadeDoCep(cidadeSimilar, resposta.bairro);
      return;
    }

    this.enderecoFamilia.carregandoCep = true;
    this.localidadesService
      .criarCidade({ nome: nomeCidade, uf })
      .subscribe({
        next: cidade => {
          this.enderecoFamilia.carregandoCep = false;
          this.adicionarCidadeOrdenada(cidade);
          this.aplicarCidadeDoCep(cidade, resposta.bairro);
        },
        error: () => {
          this.enderecoFamilia.carregandoCep = false;
          this.enderecoFamilia.erroCep = 'Não foi possível cadastrar a cidade retornada pelo CEP.';
        }
      });
  }

  private carregarRegioesFamilia(cidadeId: number, callback?: () => void): void {
    const cache = this.regioesCache.get(cidadeId);
    if (cache) {
      this.enderecoFamilia.regioes = cache;
      callback?.();
      return;
    }

    this.localidadesService.listarRegioes(cidadeId).subscribe(regioes => {
      const ordenadas = [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      this.regioesCache.set(cidadeId, ordenadas);
      this.enderecoFamilia.regioes = ordenadas;
      callback?.();
    });
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

  private adicionarCidadeOrdenada(cidade: Cidade): void {
    const existe = this.cidades.some(item => item.id === cidade.id);
    if (existe) {
      return;
    }

    this.cidades = [...this.cidades, cidade].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  private aplicarCidadeDoCep(cidade: Cidade, bairro: string | undefined): void {
    this.definirCidadeFamilia(cidade.id);
    this.carregarBairrosFamilia(cidade.id, () => {
      this.definirBairroFamiliaPorNome(bairro);
    });
  }

  private carregarBairrosFamilia(cidadeId: number, callback?: () => void): void {
    const cache = this.bairrosCache.get(cidadeId);
    if (cache) {
      this.aplicarBairrosFamilia();
      callback?.();
      return;
    }

    this.localidadesService.listarBairros(cidadeId).subscribe(bairros => {
      const ordenados = [...bairros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      this.bairrosCache.set(cidadeId, ordenados);
      this.aplicarBairrosFamilia();
      callback?.();
    });
  }

  private aplicarBairrosFamilia(): void {
    const cidadeId = this.enderecoFamilia.cidadeId;
    if (!cidadeId) {
      this.enderecoFamilia.bairros = [];
      this.enderecoFamilia.bairroSelecionado = null;
      return;
    }

    const todos = this.bairrosCache.get(cidadeId) ?? [];
    if (
      !this.enderecoFamilia.regiaoSelecionada ||
      this.enderecoFamilia.regiaoSelecionada === this.valorNovaRegiao ||
      this.enderecoFamilia.regiaoBloqueada
    ) {
      this.enderecoFamilia.bairros = [...todos];
    } else {
      const regiaoNormalizada = this.normalizarTexto(this.enderecoFamilia.regiaoSelecionada);
      this.enderecoFamilia.bairros = todos.filter(bairro => {
        if (!bairro.regiao) {
          return false;
        }
        return this.normalizarTexto(bairro.regiao) === regiaoNormalizada;
      });
    }

    if (this.enderecoFamilia.bairroSelecionado && this.enderecoFamilia.bairroSelecionado !== this.valorNovoBairro) {
      const existe = this.enderecoFamilia.bairros.some(bairro => String(bairro.id) === this.enderecoFamilia.bairroSelecionado);
      if (!existe) {
        this.enderecoFamilia.bairroSelecionado = null;
      }
    }

    this.atualizarEstadoRegiaoParaBairroSelecionado();
  }

  private obterIdBairroSelecionado(): number | null {
    if (
      !this.enderecoFamilia.bairroSelecionado ||
      this.enderecoFamilia.bairroSelecionado === this.valorNovoBairro
    ) {
      return null;
    }

    const id = Number(this.enderecoFamilia.bairroSelecionado);
    return Number.isNaN(id) ? null : id;
  }

  private obterBairroSelecionado(): Bairro | undefined {
    const cidadeId = this.enderecoFamilia.cidadeId;
    const bairroId = this.obterIdBairroSelecionado();
    if (!cidadeId || !bairroId) {
      return undefined;
    }

    const todos = this.bairrosCache.get(cidadeId) ?? [];
    return todos.find(item => item.id === bairroId);
  }

  private obterRegiaoAtualDoBairro(): string | null {
    const bairro = this.obterBairroSelecionado();
    return bairro?.regiao ?? null;
  }

  private atualizarEstadoRegiaoParaBairroSelecionado(): void {
    const bairro = this.obterBairroSelecionado();
    if (!bairro) {
      return;
    }

    if (bairro.regiao) {
      this.enderecoFamilia.regiaoSelecionada = bairro.regiao;
      this.enderecoFamilia.regiaoBloqueada = true;
    } else {
      this.enderecoFamilia.regiaoBloqueada = false;
    }
  }

  private vincularBairroARegiao(regiaoNome: string): void {
    const bairroId = this.obterIdBairroSelecionado();
    if (!bairroId) {
      return;
    }

    const regiaoNormalizada = this.normalizarTexto(regiaoNome);
    const regiao = this.enderecoFamilia.regioes.find(
      item => this.normalizarTexto(item.nome) === regiaoNormalizada
    );

    const payload = {
      bairrosIds: [bairroId],
      regiaoId: regiao?.id ?? null,
      nomeRegiaoLivre: regiao?.id ? null : regiaoNome
    };

    this.enderecoFamilia.atualizandoRegiao = true;
    this.localidadesService.atualizarRegiaoBairros(payload).subscribe({
      next: () => {
        this.enderecoFamilia.atualizandoRegiao = false;
        this.enderecoFamilia.regiaoBloqueada = true;
        this.enderecoFamilia.regiaoSelecionada = regiaoNome;
        this.novaRegiaoGeradaPorCep = false;
        this.atualizarRegiaoCacheParaBairro(bairroId, regiaoNome);
      },
      error: () => {
        this.enderecoFamilia.atualizandoRegiao = false;
        window.alert('Não foi possível vincular o bairro à região selecionada. Tente novamente.');
        this.enderecoFamilia.regiaoSelecionada = null;
        this.enderecoFamilia.regiaoBloqueada = false;
      }
    });
  }

  private atualizarRegiaoCacheParaBairro(bairroId: number, regiaoNome: string): void {
    const cidadeId = this.enderecoFamilia.cidadeId;
    if (!cidadeId) {
      return;
    }

    const cache = this.bairrosCache.get(cidadeId);
    if (cache) {
      const atualizados = cache.map(bairro =>
        bairro.id === bairroId ? { ...bairro, regiao: regiaoNome } : bairro
      );
      this.bairrosCache.set(cidadeId, atualizados);
    }

    this.enderecoFamilia.bairros = this.enderecoFamilia.bairros.map(bairro =>
      bairro.id === bairroId ? { ...bairro, regiao: regiaoNome } : bairro
    );
  }

  private definirBairroFamiliaPorNome(nomeBairro: string | undefined): void {
    const cidadeId = this.enderecoFamilia.cidadeId;
    if (!cidadeId) {
      return;
    }

    this.enderecoFamilia.atualizandoRegiao = false;
    const todos = this.bairrosCache.get(cidadeId) ?? [];
    if (!nomeBairro) {
      this.enderecoFamilia.regiaoSelecionada = null;
      this.enderecoFamilia.regiaoBloqueada = false;
      this.aplicarBairrosFamilia();
      this.enderecoFamilia.bairroSelecionado = this.valorNovoBairro;
      this.enderecoFamilia.novoBairro = '';
      this.novoBairroGeradoPorCep = true;
      return;
    }

    const bairroNormalizado = this.normalizarTexto(nomeBairro);
    const bairroEncontrado = todos.find(bairro => this.normalizarTexto(bairro.nome) === bairroNormalizado);

    if (bairroEncontrado) {
      this.enderecoFamilia.regiaoSelecionada = bairroEncontrado.regiao ?? null;
      this.enderecoFamilia.regiaoBloqueada = Boolean(bairroEncontrado.regiao);
      this.enderecoFamilia.novaRegiao = '';
      this.aplicarBairrosFamilia();
      this.enderecoFamilia.bairroSelecionado = String(bairroEncontrado.id);
      this.enderecoFamilia.novoBairro = '';
      this.novoBairroGeradoPorCep = false;
      this.novaRegiaoGeradaPorCep = false;
    } else {
      this.enderecoFamilia.regiaoSelecionada = null;
      this.enderecoFamilia.regiaoBloqueada = false;
      this.aplicarBairrosFamilia();
      this.enderecoFamilia.bairroSelecionado = this.valorNovoBairro;
      this.enderecoFamilia.novoBairro = nomeBairro;
      this.novoBairroGeradoPorCep = true;
    }
  }

  visualizarPrevia(): void {
    if (!this.formularioValido()) {
      return;
    }

    this.previaFamilia = this.gerarDadosFamilia();
    this.mostrarPrevia = true;
  }

  fecharPrevia(): void {
    this.mostrarPrevia = false;
  }

  cadastrarFamilia(): void {
    if (this.salvandoFamilia) {
      return;
    }

    if (!this.formularioValido()) {
      return;
    }

    this.salvandoFamilia = true;
    const payload = this.montarPayload();
    const emEdicao = this.modoEdicao && this.familiaIdEdicao !== null;
    const requisicao = emEdicao
      ? this.familiasService.atualizarFamilia(this.familiaIdEdicao!, payload)
      : this.familiasService.criarFamilia(payload);

    requisicao.subscribe({
      next: (resposta: FamiliaResponse | null) => {
        if (!resposta) {
          this.notificationService.showError(
            'Não foi possível confirmar o cadastro da família.',
            'Tente novamente em instantes.'
          );
          this.salvandoFamilia = false;
          return;
        }

        const responsavel = this.obterResponsavelServidor(resposta) || 'Responsável não informado';
        const totalMembros = resposta.membros.length;

        const tituloSucesso = emEdicao ? 'Família atualizada com sucesso!' : 'Família cadastrada com sucesso!';
        this.notificationService.showSuccess(
          tituloSucesso,
          `Responsável: ${responsavel}\nMembros cadastrados: ${totalMembros}`
        );
        this.salvandoFamilia = false;
        this.router.navigate(['/familias']);
      },
      error: _erro => {
        this.notificationService.showError(
          'Não foi possível cadastrar a família.',
          'Tente novamente.'
        );
        this.salvandoFamilia = false;
      }
    });
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

  obterClasseProbabilidade(probabilidade: ProbabilidadeVoto): string {
    switch (probabilidade) {
      case 'Alta':
        return 'text-green-600 bg-green-100';
      case 'Média':
        return 'text-yellow-600 bg-yellow-100';
      case 'Baixa':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  abrirWhatsApp(telefone: string): void {
    if (!telefone) {
      window.alert('Informe um telefone para contatar via WhatsApp.');
      return;
    }

    const somenteNumeros = this.obterTelefoneLimpo(telefone);
    if (!somenteNumeros) {
      window.alert('Telefone inválido para contato via WhatsApp.');
      return;
    }

    const link = `https://wa.me/55${somenteNumeros}`;
    window.open(link, '_blank');
  }

  private criarMembro(responsavelPrincipal: boolean): MembroFamiliaForm {
    return {
      nome: '',
      nascimento: '',
      profissao: '',
      parentesco: responsavelPrincipal ? PARENTESCO_RESPONSAVEL : '',
      responsavel: responsavelPrincipal,
      probabilidade: '',
      telefone: ''
    };
  }

  private criarEnderecoFamilia(): FamiliaEnderecoForm {
    return {
      cep: '',
      rua: '',
      numero: '',
      cidadeId: null,
      regiaoSelecionada: null,
      novaRegiao: '',
      bairroSelecionado: null,
      novoBairro: '',
      regiaoBloqueada: false,
      atualizandoRegiao: false,
      carregandoCep: false,
      erroCep: null,
      regioes: [],
      bairros: []
    };
  }


  private formularioValido(): boolean {
    const rua = this.normalizarTexto(this.enderecoFamilia.rua);
    const numero = this.normalizarTexto(this.enderecoFamilia.numero);
    const cidadeId = this.enderecoFamilia.cidadeId;
    const bairroSelecionado = this.enderecoFamilia.bairroSelecionado;
    const novoBairro = this.normalizarTexto(this.enderecoFamilia.novoBairro);
    const regiaoSelecionada = this.enderecoFamilia.regiaoSelecionada;
    const novaRegiao = this.normalizarTexto(this.enderecoFamilia.novaRegiao);

    if (!rua || !numero) {
      window.alert('Por favor, preencha rua e número da família.');
      return false;
    }

    if (cidadeId === null) {
      window.alert('Selecione a cidade do endereço da família.');
      return false;
    }

    if (!bairroSelecionado) {
      window.alert('Selecione um bairro para o endereço da família ou cadastre um novo.');
      return false;
    }

    if (bairroSelecionado === this.valorNovoBairro && !novoBairro) {
      window.alert('Informe o nome do novo bairro da família.');
      return false;
    }

    if (regiaoSelecionada === this.valorNovaRegiao && !novaRegiao) {
      window.alert('Informe o nome da nova região da família.');
      return false;
    }

    for (let indice = 0; indice < this.membros.length; indice += 1) {
      const membro = this.membros[indice];
      const nome = this.normalizarTexto(membro.nome);
      const nascimento = membro.nascimento?.trim() || '';
      const probabilidade = this.normalizarTexto(membro.probabilidade);
      const parentesco = this.normalizarTexto(membro.parentesco);
      const responsavel = this.normalizarResponsavel(membro.responsavel);

      if (!nome || !nascimento || !probabilidade || (!responsavel && !parentesco)) {
        window.alert(`Preencha todos os campos obrigatórios do ${indice + 1}º membro da família.`);
        return false;
      }
    }

    const possuiResponsavel = this.membros.some(membro => this.normalizarResponsavel(membro.responsavel));
    if (!possuiResponsavel) {
      window.alert('Selecione um responsável principal para a família.');
      return false;
    }

    return true;
  }

  private montarPayload(): FamiliaPayload {
    const membros = this.membros.map(membro => this.mapearMembroPayload(membro));

    const regiaoSelecionada = this.enderecoFamilia.regiaoSelecionada;
    const novaRegiao =
      regiaoSelecionada === this.valorNovaRegiao
        ? this.enderecoFamilia.novaRegiao.trim() || null
        : regiaoSelecionada?.trim() || null;

    return {
      cep: this.enderecoFamilia.cep ? this.enderecoFamilia.cep.trim() : null,
      rua: this.enderecoFamilia.rua.trim(),
      numero: this.enderecoFamilia.numero.trim(),
      cidadeId: this.enderecoFamilia.cidadeId!,
      novaRegiao,
      membros
    };
  }

  private mapearMembroPayload(membro: MembroFamiliaForm): FamiliaMembroPayload {
    const parentesco = membro.responsavel ? PARENTESCO_RESPONSAVEL : membro.parentesco;
    return {
      nomeCompleto: membro.nome.trim(),
      dataNascimento: membro.nascimento || null,
      profissao: membro.profissao ? membro.profissao.trim() : null,
      parentesco: parentesco as GrauParentesco,
      responsavelPrincipal: membro.responsavel,
      probabilidadeVoto: membro.probabilidade,
      telefone: this.obterTelefoneLimpo(membro.telefone)
    };
  }

  atualizarTelefoneMembro(indice: number, valor: string): void {
    const telefoneFormatado = this.aplicarMascaraTelefone(valor);
    this.membros[indice].telefone = telefoneFormatado;
  }

  private aplicarMascaraTelefone(valor: string): string {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (!numeros) {
      return '';
    }

    const partes = numeros.match(/^(\d{0,2})(\d{0,1})(\d{0,4})(\d{0,4})$/);
    if (!partes) {
      return '';
    }

    const [, ddd, primeiroDigito, bloco1, bloco2] = partes;

    let resultado = '';

    if (ddd) {
      resultado += `(${ddd}`;
      if (ddd.length === 2) {
        resultado += ') ';
      }
    }

    if (primeiroDigito) {
      resultado += primeiroDigito;
      if (bloco1 || bloco2) {
        resultado += ' ';
      }
    }

    if (bloco1) {
      resultado += bloco1;
    }

    if (bloco2) {
      resultado += `-${bloco2}`;
    }

    return resultado.trim();
  }

  private obterTelefoneLimpo(telefone: string): string | null {
    if (!telefone) {
      return null;
    }
    const numeros = telefone.replace(/\D/g, '').slice(0, 11);
    return numeros ? numeros : null;
  }

  private gerarDadosFamilia(incluirIdade = true): PreviaFamilia {
    const membros: PreviaMembro[] = this.membros.map(membro => {
      const codigoParentesco = membro.responsavel ? PARENTESCO_RESPONSAVEL : membro.parentesco;
      return {
        nome: this.normalizarTexto(membro.nome),
        idade: incluirIdade ? this.calcularIdade(membro.nascimento) : null,
        profissao: this.normalizarTexto(membro.profissao),
        parentesco: this.obterDescricaoParentesco(codigoParentesco),
        responsavel: this.normalizarResponsavel(membro.responsavel),
        probabilidade: this.normalizarTexto(membro.probabilidade) as ProbabilidadeVoto,
        telefone: membro.telefone.trim()
      };
    });

    const endereco = `${this.enderecoFamilia.rua.trim()}, ${this.enderecoFamilia.numero.trim()}`;
    const bairro = this.obterDescricaoBairroFamilia() || 'Bairro não informado';
    const regiao = this.obterDescricaoRegiaoFamilia();
    const cidade = this.obterDescricaoCidadeFamilia() || 'Cidade não informada';
    const cep = this.enderecoFamilia.cep.trim();

    return {
      responsavelPrincipal: this.obterResponsavelPrincipal(),
      enderecoCompleto: endereco,
      bairro,
      regiao,
      cidade,
      cep,
      membros
    };
  }

  obterResponsavelPrincipal(): string {
    const responsavel = this.membros.find(membro => this.normalizarResponsavel(membro.responsavel));
    return responsavel?.nome?.trim() || '';
  }

  obterDescricaoParentesco(parentesco: GrauParentesco | ''): string {
    if (!parentesco) {
      return '';
    }
    return this.descricoesParentesco[parentesco];
  }

  private obterDescricaoBairroFamilia(): string {
    if (this.enderecoFamilia.bairroSelecionado === this.valorNovoBairro) {
      return this.enderecoFamilia.novoBairro.trim();
    }
    const cidadeId = this.enderecoFamilia.cidadeId;
    if (cidadeId === null || !this.enderecoFamilia.bairroSelecionado) {
      return '';
    }
    const todos = this.bairrosCache.get(cidadeId) ?? [];
    const bairro = todos.find(item => String(item.id) === this.enderecoFamilia.bairroSelecionado);
    return bairro?.nome ?? '';
  }

  private obterDescricaoRegiaoFamilia(): string {
    if (this.enderecoFamilia.regiaoSelecionada === this.valorNovaRegiao) {
      return this.enderecoFamilia.novaRegiao.trim();
    }
    return this.enderecoFamilia.regiaoSelecionada?.trim() || '';
  }

  private obterDescricaoCidadeFamilia(): string {
    const cidade = this.obterCidadePorId(this.enderecoFamilia.cidadeId);
    return cidade ? `${cidade.nome} - ${cidade.uf}` : '';
  }

  private obterCidadePorId(cidadeId: number | null): Cidade | undefined {
    return cidadeId !== null ? this.cidades.find(cidade => cidade.id === cidadeId) : undefined;
  }

  private obterResponsavelServidor(resposta: FamiliaResponse): string | undefined {
    const responsavel = resposta.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto;
  }

  private normalizarTexto(valor: string | GrauParentesco | null | undefined): string {
    if (!valor) {
      return '';
    }
    const texto = String(valor);
    const semAcento = texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return semAcento.toUpperCase().replace(/\s+/g, ' ').trim();
  }

  private normalizarResponsavel(valor: boolean | string): boolean {
    if (typeof valor === 'string') {
      return valor.toLowerCase() === 'true';
    }
    return Boolean(valor);
  }

  private calcularIdade(dataNascimento: string): number | null {
    if (!dataNascimento) {
      return null;
    }

    const nascimento = new Date(dataNascimento);
    if (Number.isNaN(nascimento.getTime())) {
      return null;
    }

    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade -= 1;
    }
    return idade;
  }

}
