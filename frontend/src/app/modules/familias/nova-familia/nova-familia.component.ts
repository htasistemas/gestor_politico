import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FamiliasService, FamiliaMembroPayload, FamiliaPayload, FamiliaResponse } from '../familias.service';
import { Bairro, Cidade, LocalidadesService, Regiao } from '../../shared/services/localidades.service';
import { ViaCepResponse, ViaCepService } from '../../shared/services/via-cep.service';

const VALOR_NOVA_REGIAO = '__nova__';
const VALOR_NOVO_BAIRRO = '__novo__';

type ProbabilidadeVoto = 'Alta' | 'Média' | 'Baixa' | '';

type GrauParentesco =
  | 'Pai'
  | 'Mãe'
  | 'Filho(a)'
  | 'Filha'
  | 'Filho'
  | 'Irmão(ã)'
  | 'Primo(a)'
  | 'Tio(a)'
  | 'Sobrinho(a)'
  | 'Cônjuge'
  | 'Avô(ó)'
  | 'Enteado(a)'
  | 'Outro'
  | '';

interface MembroFamiliaForm {
  nome: string;
  cpf: string;
  nascimento: string;
  profissao: string;
  parentesco: GrauParentesco;
  responsavel: boolean;
  probabilidade: ProbabilidadeVoto;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  cidadeId: number | null;
  regiaoSelecionada: string | null;
  novaRegiao: string;
  bairroSelecionado: string | null;
  novoBairro: string;
  preenchimentoManual: boolean;
  carregandoCep: boolean;
  erroCep: string | null;
  regioes: Regiao[];
  bairros: Bairro[];
}

interface PreviaMembro {
  nome: string;
  cpf: string;
  idade: number | null;
  profissao: string;
  parentesco: GrauParentesco;
  responsavel: boolean;
  probabilidade: ProbabilidadeVoto;
  telefone: string;
  cep: string;
  endereco: string;
  bairro: string;
  regiao: string;
  cidade: string;
}

interface PreviaFamilia {
  responsavelPrincipal: string;
  endereco: string;
  bairro: string;
  telefone: string;
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

  familia = {
    endereco: '',
    bairro: '',
    telefone: ''
  };

  cidades: Cidade[] = [];
  private readonly regioesCache = new Map<number, Regiao[]>();
  private readonly bairrosCache = new Map<number, Bairro[]>();

  get bairrosDisponiveisFamilia(): string[] {
    const nomes = new Set<string>();
    this.bairrosCache.forEach(lista => {
      lista.forEach(bairro => nomes.add(bairro.nome));
    });
    return Array.from(nomes).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  grausParentesco: GrauParentesco[] = [
    'Pai',
    'Mãe',
    'Filho(a)',
    'Filha',
    'Filho',
    'Irmão(ã)',
    'Primo(a)',
    'Tio(a)',
    'Sobrinho(a)',
    'Cônjuge',
    'Avô(ó)',
    'Enteado(a)',
    'Outro'
  ];

  membros: MembroFamiliaForm[];

  mostrarPrevia = false;
  previaFamilia: PreviaFamilia | null = null;

  constructor(
    private readonly router: Router,
    private readonly familiasService: FamiliasService,
    private readonly localidadesService: LocalidadesService,
    private readonly viaCepService: ViaCepService
  ) {
    this.membros = [this.criarMembro(true)];
  }

  ngOnInit(): void {
    this.localidadesService.listarCidades().subscribe(cidades => {
      this.cidades = cidades;
      const cidadePadrao = cidades.length > 0 ? cidades[0].id : null;
      if (cidadePadrao !== null) {
        this.membros.forEach(membro => this.definirCidade(membro, cidadePadrao));
      }
    });
  }

  voltarPagina(): void {
    this.router.navigate(['/familias']);
  }

  cancelarCadastro(): void {
    this.router.navigate(['/familias']);
  }

  adicionarMembro(): void {
    const novoMembro = this.criarMembro(false);
    const cidadePadrao = this.cidades.length > 0 ? this.cidades[0].id : null;
    if (cidadePadrao !== null) {
      this.definirCidade(novoMembro, cidadePadrao);
    }
    this.membros.push(novoMembro);
  }

  removerMembro(indice: number): void {
    if (indice === 0 || this.membros.length <= 1) {
      window.alert('É necessário manter pelo menos um responsável cadastrado.');
      return;
    }

    this.membros.splice(indice, 1);
    if (!this.membros.some(membro => membro.responsavel)) {
      this.membros[0].responsavel = true;
    }
  }

  definirResponsavel(indice: number, selecionado: boolean): void {
    if (selecionado) {
      this.membros = this.membros.map((membro, posicao) => ({
        ...membro,
        responsavel: posicao === indice
      }));
      return;
    }

    const existeOutroResponsavel = this.membros.some((membro, posicao) => posicao !== indice && membro.responsavel);
    if (!existeOutroResponsavel) {
      window.alert('A família precisa ter um responsável principal.');
      this.membros[indice].responsavel = true;
      return;
    }

    this.membros[indice].responsavel = false;
  }

  aoAlterarCidade(indice: number, cidadeId: number | null): void {
    const membro = this.membros[indice];
    if (cidadeId === null) {
      membro.cidadeId = null;
      membro.regioes = [];
      membro.bairros = [];
      membro.regiaoSelecionada = null;
      membro.bairroSelecionado = null;
      return;
    }
    this.definirCidade(membro, cidadeId);
  }

  aoAlterarRegiao(indice: number, valor: string | null): void {
    const membro = this.membros[indice];
    membro.regiaoSelecionada = valor && valor !== '' ? valor : null;
    if (membro.regiaoSelecionada === this.valorNovaRegiao) {
      membro.novaRegiao = '';
      membro.bairroSelecionado = this.valorNovoBairro;
      membro.bairros = [];
    } else {
      membro.novaRegiao = '';
      this.aplicarBairrosAoMembro(membro);
    }
  }

  aoAlterarBairro(indice: number, valor: string | null): void {
    const membro = this.membros[indice];
    membro.bairroSelecionado = valor && valor !== '' ? valor : null;
    if (membro.bairroSelecionado === this.valorNovoBairro) {
      membro.novoBairro = '';
    } else {
      membro.novoBairro = '';
    }
  }

  alternarPreenchimentoManual(indice: number): void {
    const membro = this.membros[indice];
    membro.preenchimentoManual = !membro.preenchimentoManual;
    if (membro.preenchimentoManual) {
      membro.erroCep = null;
    }
  }

  buscarCep(indice: number): void {
    const membro = this.membros[indice];
    const cepLimpo = membro.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      membro.erroCep = 'Informe um CEP válido com 8 dígitos.';
      return;
    }

    membro.carregandoCep = true;
    membro.erroCep = null;
    this.viaCepService.buscarCep(cepLimpo).subscribe({
      next: resposta => {
        membro.carregandoCep = false;
        if (!resposta) {
          membro.erroCep = 'CEP não encontrado. Preencha manualmente.';
          membro.preenchimentoManual = true;
          return;
        }
        this.aplicarDadosViaCep(membro, resposta);
      },
      error: () => {
        membro.carregandoCep = false;
        membro.erroCep = 'Não foi possível consultar o CEP. Tente novamente.';
      }
    });
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
    if (!this.formularioValido()) {
      return;
    }

    const payload = this.montarPayload();
    this.familiasService.criarFamilia(payload).subscribe({
      next: (resposta: FamiliaResponse | null) => {
        if (!resposta) {
          window.alert('Não foi possível confirmar o cadastro da família no banco de dados. Tente novamente.');
          return;
        }

        const responsavel = this.obterResponsavelServidor(resposta) || 'Responsável não informado';
        const totalMembros = resposta.membros.length;

        window.alert(
          `Família do responsável "${responsavel}" cadastrada com sucesso!\n` + `Membros cadastrados: ${totalMembros}`
        );
        this.router.navigate(['/familias']);
      },
      error: erro => {
        console.error('Erro ao cadastrar família', erro);
        window.alert('Não foi possível cadastrar a família. Tente novamente.');
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

    const somenteNumeros = telefone.replace(/\D/g, '');
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
      cpf: '',
      nascimento: '',
      profissao: '',
      parentesco: '',
      responsavel: responsavelPrincipal,
      probabilidade: '',
      telefone: '',
      cep: '',
      rua: '',
      numero: '',
      cidadeId: null,
      regiaoSelecionada: null,
      novaRegiao: '',
      bairroSelecionado: null,
      novoBairro: '',
      preenchimentoManual: false,
      carregandoCep: false,
      erroCep: null,
      regioes: [],
      bairros: []
    };
  }

  private definirCidade(membro: MembroFamiliaForm, cidadeId: number): void {
    membro.cidadeId = cidadeId;
    membro.regioes = [];
    membro.bairros = [];
    membro.regiaoSelecionada = null;
    membro.novaRegiao = '';
    membro.bairroSelecionado = null;
    membro.novoBairro = '';

    this.carregarRegioes(cidadeId, membro);
    this.carregarBairrosCidade(cidadeId, membro);
  }

  private carregarRegioes(cidadeId: number, membro: MembroFamiliaForm): void {
    const cache = this.regioesCache.get(cidadeId);
    if (cache) {
      membro.regioes = cache;
      return;
    }

    this.localidadesService.listarRegioes(cidadeId).subscribe(regioes => {
      const ordenadas = [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      this.regioesCache.set(cidadeId, ordenadas);
      membro.regioes = ordenadas;
    });
  }

  private carregarBairrosCidade(cidadeId: number, membro: MembroFamiliaForm, callback?: () => void): void {
    const cache = this.bairrosCache.get(cidadeId);
    if (cache) {
      this.aplicarBairrosAoMembro(membro);
      callback?.();
      return;
    }

    this.localidadesService.listarBairros(cidadeId).subscribe(bairros => {
      const ordenados = [...bairros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      this.bairrosCache.set(cidadeId, ordenados);
      this.aplicarBairrosAoMembro(membro);
      callback?.();
    });
  }

  private aplicarBairrosAoMembro(membro: MembroFamiliaForm): void {
    if (!membro.cidadeId) {
      membro.bairros = [];
      membro.bairroSelecionado = null;
      return;
    }

    const todos = this.bairrosCache.get(membro.cidadeId) ?? [];
    if (!membro.regiaoSelecionada || membro.regiaoSelecionada === this.valorNovaRegiao) {
      membro.bairros = [...todos];
    } else {
      const regiaoNormalizada = this.normalizarTexto(membro.regiaoSelecionada);
      membro.bairros = todos.filter(bairro => {
        if (!bairro.regiao) {
          return false;
        }
        return this.normalizarTexto(bairro.regiao) === regiaoNormalizada;
      });
    }

    if (membro.bairroSelecionado && membro.bairroSelecionado !== this.valorNovoBairro) {
      const existe = membro.bairros.some(bairro => String(bairro.id) === membro.bairroSelecionado);
      if (!existe) {
        membro.bairroSelecionado = null;
      }
    }
  }

  private aplicarDadosViaCep(membro: MembroFamiliaForm, resposta: ViaCepResponse): void {
    if (resposta.cep) {
      membro.cep = resposta.cep;
    }
    if (resposta.logradouro) {
      membro.rua = resposta.logradouro;
    }

    membro.preenchimentoManual = false;
    membro.erroCep = null;

    const cidadeEncontrada = this.cidades.find(cidade => {
      const mesmoNome = this.normalizarTexto(cidade.nome) === this.normalizarTexto(resposta.localidade);
      const mesmaUf = cidade.uf.toUpperCase() === (resposta.uf ?? '').toUpperCase();
      return mesmoNome && mesmaUf;
    });

    if (!cidadeEncontrada) {
      membro.preenchimentoManual = true;
      membro.erroCep = 'Cidade do CEP não cadastrada. Preencha manualmente.';
      return;
    }

    this.definirCidade(membro, cidadeEncontrada.id);
    this.carregarBairrosCidade(cidadeEncontrada.id, membro, () => {
      this.definirBairroPorNome(membro, resposta.bairro);
    });
  }

  private definirBairroPorNome(membro: MembroFamiliaForm, nomeBairro: string | undefined): void {
    if (!membro.cidadeId) {
      return;
    }

    const todos = this.bairrosCache.get(membro.cidadeId) ?? [];
    if (!nomeBairro) {
      membro.bairroSelecionado = this.valorNovoBairro;
      membro.novoBairro = '';
      membro.regiaoSelecionada = null;
      this.aplicarBairrosAoMembro(membro);
      return;
    }

    const bairroNormalizado = this.normalizarTexto(nomeBairro);
    const bairroEncontrado = todos.find(bairro => this.normalizarTexto(bairro.nome) === bairroNormalizado);

    if (bairroEncontrado) {
      membro.regiaoSelecionada = bairroEncontrado.regiao ?? null;
      membro.novaRegiao = '';
      this.aplicarBairrosAoMembro(membro);
      membro.bairroSelecionado = String(bairroEncontrado.id);
      membro.novoBairro = '';
    } else {
      membro.regiaoSelecionada = null;
      this.aplicarBairrosAoMembro(membro);
      membro.bairroSelecionado = this.valorNovoBairro;
      membro.novoBairro = nomeBairro;
    }
  }

  private formularioValido(): boolean {
    const endereco = this.normalizarTexto(this.familia.endereco);
    const bairro = this.normalizarTexto(this.familia.bairro);
    const telefone = this.normalizarTexto(this.familia.telefone);

    if (!endereco || !bairro || !telefone) {
      window.alert('Por favor, preencha todas as informações da família.');
      return false;
    }

    for (let indice = 0; indice < this.membros.length; indice += 1) {
      const membro = this.membros[indice];
      const nome = this.normalizarTexto(membro.nome);
      const nascimento = membro.nascimento?.trim() || '';
      const probabilidade = this.normalizarTexto(membro.probabilidade);
      const parentesco = this.normalizarTexto(membro.parentesco);
      const cpf = membro.cpf.replace(/\D/g, '');
      const rua = this.normalizarTexto(membro.rua);
      const numero = this.normalizarTexto(membro.numero);

      if (!nome || !nascimento || !probabilidade || !parentesco) {
        window.alert(`Preencha todos os campos obrigatórios do ${indice + 1}º membro da família.`);
        return false;
      }

      if (cpf.length !== 11) {
        window.alert(`Informe um CPF válido para o ${indice + 1}º membro da família.`);
        return false;
      }

      if (!membro.cidadeId) {
        window.alert(`Selecione a cidade do ${indice + 1}º membro da família.`);
        return false;
      }

      if (!rua || !numero) {
        window.alert(`Informe rua e número do endereço do ${indice + 1}º membro da família.`);
        return false;
      }

      if (!membro.bairroSelecionado) {
        window.alert(`Selecione um bairro ou cadastre um novo para o ${indice + 1}º membro da família.`);
        return false;
      }

      if (membro.bairroSelecionado === this.valorNovoBairro) {
        const novoBairro = this.normalizarTexto(membro.novoBairro);
        if (!novoBairro) {
          window.alert(`Informe o nome do novo bairro para o ${indice + 1}º membro da família.`);
          return false;
        }
      }

      if (membro.regiaoSelecionada === this.valorNovaRegiao) {
        const novaRegiao = this.normalizarTexto(membro.novaRegiao);
        if (!novaRegiao) {
          window.alert(`Informe o nome da nova região para o ${indice + 1}º membro da família.`);
          return false;
        }
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

    return {
      endereco: this.familia.endereco.trim(),
      bairro: this.familia.bairro.trim(),
      telefone: this.familia.telefone.trim(),
      membros
    };
  }

  private mapearMembroPayload(membro: MembroFamiliaForm): FamiliaMembroPayload {
    const bairroSelecionado =
      membro.bairroSelecionado && membro.bairroSelecionado !== this.valorNovoBairro
        ? Number(membro.bairroSelecionado)
        : null;
    const novoBairro = membro.bairroSelecionado === this.valorNovoBairro ? membro.novoBairro.trim() || null : null;
    const regiao =
      membro.regiaoSelecionada === this.valorNovaRegiao
        ? membro.novaRegiao.trim() || null
        : membro.regiaoSelecionada?.trim() || null;

    return {
      nomeCompleto: membro.nome.trim(),
      cpf: membro.cpf.replace(/\D/g, ''),
      dataNascimento: membro.nascimento || null,
      profissao: membro.profissao ? membro.profissao.trim() : null,
      parentesco: membro.parentesco,
      responsavelPrincipal: membro.responsavel,
      probabilidadeVoto: membro.probabilidade,
      telefone: membro.telefone ? membro.telefone.trim() : null,
      cep: membro.cep ? membro.cep.trim() : null,
      rua: membro.rua.trim(),
      numero: membro.numero.trim(),
      cidadeId: membro.cidadeId!,
      bairroId: bairroSelecionado,
      novoBairro,
      novaRegiao: regiao
    };
  }

  private gerarDadosFamilia(incluirIdade = true): PreviaFamilia {
    const membros: PreviaMembro[] = this.membros.map(membro => {
      const cidade = this.obterCidadePorId(membro.cidadeId);
      const cidadeDescricao = cidade ? `${cidade.nome} - ${cidade.uf}` : 'Cidade não informada';
      const bairroDescricao = this.obterDescricaoBairro(membro) || 'Bairro não informado';
      const regiaoDescricao = this.obterDescricaoRegiao(membro);
      const endereco = `${membro.rua.trim()}, ${membro.numero.trim()}`;

      return {
        nome: this.normalizarTexto(membro.nome),
        cpf: this.formatarCpf(membro.cpf),
        idade: incluirIdade ? this.calcularIdade(membro.nascimento) : null,
        profissao: this.normalizarTexto(membro.profissao),
        parentesco: this.normalizarTexto(membro.parentesco) as GrauParentesco,
        responsavel: this.normalizarResponsavel(membro.responsavel),
        probabilidade: this.normalizarTexto(membro.probabilidade) as ProbabilidadeVoto,
        telefone: this.normalizarTexto(membro.telefone),
        cep: membro.cep,
        endereco,
        bairro: bairroDescricao,
        regiao: regiaoDescricao,
        cidade: cidadeDescricao
      };
    });

    const endereco = this.normalizarTexto(this.familia.endereco);
    const bairro = this.normalizarTexto(this.familia.bairro);
    const telefone = this.normalizarTexto(this.familia.telefone);

    return {
      responsavelPrincipal: this.obterResponsavelPrincipal(),
      endereco,
      bairro,
      telefone,
      membros
    };
  }

  obterResponsavelPrincipal(): string {
    const responsavel = this.membros.find(membro => this.normalizarResponsavel(membro.responsavel));
    return responsavel?.nome?.trim() || '';
  }

  private obterDescricaoBairro(membro: MembroFamiliaForm): string {
    if (membro.bairroSelecionado === this.valorNovoBairro) {
      return membro.novoBairro.trim();
    }
    if (!membro.cidadeId || !membro.bairroSelecionado) {
      return '';
    }
    const todos = this.bairrosCache.get(membro.cidadeId) ?? [];
    const bairro = todos.find(item => String(item.id) === membro.bairroSelecionado);
    return bairro?.nome ?? '';
  }

  private obterDescricaoRegiao(membro: MembroFamiliaForm): string {
    if (membro.regiaoSelecionada === this.valorNovaRegiao) {
      return membro.novaRegiao.trim();
    }
    return membro.regiaoSelecionada?.trim() || '';
  }

  private obterCidadePorId(cidadeId: number | null): Cidade | undefined {
    return cidadeId !== null ? this.cidades.find(cidade => cidade.id === cidadeId) : undefined;
  }

  private obterResponsavelServidor(resposta: FamiliaResponse): string | undefined {
    const responsavel = resposta.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto;
  }

  private normalizarTexto(valor: string): string {
    if (!valor) {
      return '';
    }
    const semAcento = valor
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

  private formatarCpf(cpf: string): string {
    const somenteNumeros = cpf.replace(/\D/g, '');
    if (somenteNumeros.length !== 11) {
      return somenteNumeros;
    }
    return `${somenteNumeros.substring(0, 3)}.${somenteNumeros.substring(3, 6)}.${somenteNumeros.substring(6, 9)}-${somenteNumeros.substring(9)}`;
  }
}
