import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FamiliasService, FamiliaPayload } from '../familias.service';

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

interface MembroFamilia {
  nome: string;
  nascimento: string;
  profissao: string;
  parentesco: GrauParentesco;
  responsavel: boolean;
  probabilidade: ProbabilidadeVoto;
  telefone: string;
}

interface PreviaMembro extends MembroFamilia {
  idade: number | null;
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
  private readonly STORAGE_KEY = 'rascunho_familia';

  familia = {
    endereco: '',
    bairro: '',
    telefone: ''
  };

  bairros: string[] = ['Centro', 'Vila Nova', 'Jardim América', 'Santa Rita', 'São João', 'Outro'];
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

  membros: MembroFamilia[] = [
    {
      nome: '',
      nascimento: '',
      profissao: '',
      parentesco: '',
      responsavel: true,
      probabilidade: '',
      telefone: ''
    }
  ];

  mostrarPrevia = false;
  previaFamilia: PreviaFamilia | null = null;

  constructor(
    private readonly router: Router,
    private readonly familiasService: FamiliasService
  ) {}

  ngOnInit(): void {
    this.carregarRascunho();
  }

  voltarPagina(): void {
    this.router.navigate(['/familias']);
  }

  cancelarCadastro(): void {
    this.router.navigate(['/familias']);
  }

  adicionarMembro(): void {
    this.membros.push({
      nome: '',
      nascimento: '',
      profissao: '',
      parentesco: '',
      responsavel: false,
      probabilidade: '',
      telefone: ''
    });
  }

  removerMembro(indice: number): void {
    if (indice === 0 || this.membros.length <= 1) {
      window.alert('É necessário manter pelo menos um responsável cadastrado.');
      return;
    }

    this.membros.splice(indice, 1);
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
      next: () => {
        const dados = this.gerarDadosFamilia();
        const responsavel = dados.responsavelPrincipal || 'Responsável não definido';
        window.alert(
          `Família do responsável "${responsavel}" cadastrada com sucesso!\n` +
            `Membros cadastrados: ${dados.membros.length}`
        );
        this.removerRascunho();
        this.router.navigate(['/familias']);
      },
      error: erro => {
        console.error('Erro ao cadastrar família', erro);
        window.alert('Não foi possível cadastrar a família. Tente novamente.');
      }
    });
  }

  salvarRascunho(): void {
    if (!this.storageDisponivel()) {
      window.alert('Não foi possível salvar o rascunho neste dispositivo.');
      return;
    }

    const dados = this.gerarDadosFamilia(false);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dados));
      window.alert('Rascunho salvo com sucesso!');
    } catch (erro) {
      console.error('Erro ao salvar rascunho', erro);
    }
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

  obterResponsavelPrincipal(): string {
    const responsavel = this.membros.find(membro => membro.responsavel);
    return responsavel?.nome?.trim() || '';
  }

  definirResponsavel(indice: number, selecionado: boolean): void {
    if (selecionado) {
      this.membros = this.membros.map((membro, posicao) => ({
        ...membro,
        responsavel: posicao === indice
      }));
      return;
    }

    const existeOutroResponsavel = this.membros.some(
      (membro, posicao) => posicao !== indice && membro.responsavel
    );

    if (!existeOutroResponsavel) {
      window.alert('A família precisa ter um responsável principal.');
      this.membros[indice].responsavel = true;
      return;
    }

    this.membros[indice].responsavel = false;
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

  private formularioValido(): boolean {
    if (!this.familia.endereco || !this.familia.bairro || !this.familia.telefone) {
      window.alert('Por favor, preencha todas as informações da família.');
      return false;
    }

    for (let indice = 0; indice < this.membros.length; indice += 1) {
      const membro = this.membros[indice];
      if (!membro.nome || !membro.nascimento || !membro.probabilidade || !membro.parentesco) {
        window.alert(`Preencha todos os campos obrigatórios do ${indice + 1}º membro da família.`);
        return false;
      }
    }

    const possuiResponsavel = this.membros.some(membro => membro.responsavel);
    if (!possuiResponsavel) {
      window.alert('Selecione um responsável principal para a família.');
      return false;
    }

    return true;
  }

  private gerarDadosFamilia(incluirIdade = true): PreviaFamilia {
    const membros: PreviaMembro[] = this.membros.map(membro => ({
      ...membro,
      idade: incluirIdade ? this.calcularIdade(membro.nascimento) : null
    }));

    return {
      responsavelPrincipal: this.obterResponsavelPrincipal(),
      endereco: this.familia.endereco,
      bairro: this.familia.bairro,
      telefone: this.familia.telefone,
      membros
    };
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

    return idade >= 0 ? idade : null;
  }

  private carregarRascunho(): void {
    if (!this.storageDisponivel()) {
      return;
    }

    try {
      const rascunho = localStorage.getItem(this.STORAGE_KEY);
      if (!rascunho) {
        return;
      }

      const dados: (PreviaFamilia & { nomeFamilia?: string }) | null = JSON.parse(rascunho);
      this.familia = {
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        telefone: dados.telefone || ''
      };

      if (dados.membros && dados.membros.length > 0) {
        this.membros = dados.membros.map((membro, indice) => ({
          nome: membro.nome,
          nascimento: membro.nascimento,
          profissao: membro.profissao,
          parentesco: (membro.parentesco as GrauParentesco) || '',
          responsavel:
            typeof membro.responsavel === 'boolean'
              ? membro.responsavel
              : ((membro as { papel?: string }).papel === 'Responsável' || indice === 0),
          probabilidade: membro.probabilidade,
          telefone: membro.telefone || ''
        }));

        const responsavelIndex = this.membros.findIndex(m => m.responsavel);
        if (responsavelIndex === -1 && this.membros.length > 0) {
          this.membros[0].responsavel = true;
        }
      } else {
        this.membros = [
          {
            nome: '',
            nascimento: '',
            profissao: '',
            parentesco: '',
            responsavel: true,
            probabilidade: '',
            telefone: ''
          }
        ];
      }
    } catch (erro) {
      console.error('Erro ao carregar rascunho', erro);
    }
  }

  private montarPayload(): FamiliaPayload {
    return {
      endereco: this.familia.endereco,
      bairro: this.familia.bairro,
      telefone: this.familia.telefone,
      membros: this.membros.map(membro => ({
        nomeCompleto: membro.nome,
        dataNascimento: membro.nascimento || null,
        profissao: membro.profissao || null,
        parentesco: membro.parentesco || 'Outro',
        responsavelPrincipal: membro.responsavel,
        probabilidadeVoto: membro.probabilidade,
        telefone: membro.telefone || null
      }))
    };
  }
  private removerRascunho(): void {
    if (!this.storageDisponivel()) {
      return;
    }

    localStorage.removeItem(this.STORAGE_KEY);
  }

  private storageDisponivel(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch (erro) {
      console.error('Storage indisponível', erro);
      return false;
    }
  }
}
