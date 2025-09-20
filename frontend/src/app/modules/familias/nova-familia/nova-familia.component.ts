import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

type ProbabilidadeVoto = 'Alta' | 'Média' | 'Baixa' | '';

type PapelFamilia = 'Responsável' | 'Membro' | '';

interface MembroFamilia {
  nome: string;
  nascimento: string;
  profissao: string;
  papel: PapelFamilia;
  probabilidade: ProbabilidadeVoto;
}

interface PreviaMembro extends MembroFamilia {
  idade: number | null;
}

interface PreviaFamilia {
  nomeFamilia: string;
  endereco: string;
  bairro: string;
  telefone: string;
  membros: PreviaMembro[];
}

@Component({
  selector: 'app-nova-familia',
  templateUrl: './nova-familia.component.html',
  styleUrls: ['./nova-familia.component.css']
})
export class NovaFamiliaComponent implements OnInit {
  private readonly STORAGE_KEY = 'rascunho_familia';

  familia = {
    nome: '',
    endereco: '',
    bairro: '',
    telefone: ''
  };

  bairros: string[] = ['Centro', 'Vila Nova', 'Jardim América', 'Santa Rita', 'São João', 'Outro'];

  membros: MembroFamilia[] = [
    {
      nome: '',
      nascimento: '',
      profissao: '',
      papel: 'Responsável',
      probabilidade: ''
    }
  ];

  mostrarPrevia = false;
  previaFamilia: PreviaFamilia | null = null;

  constructor(private readonly router: Router) {}

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
      papel: 'Membro',
      probabilidade: ''
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

    const dados = this.gerarDadosFamilia();
    console.table(dados);
    window.alert(
      `Família "${dados.nomeFamilia || 'Sem identificação'}" cadastrada com sucesso!\n` +
        `Membros cadastrados: ${dados.membros.length}`
    );

    this.removerRascunho();
    this.router.navigate(['/familias']);
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

  private formularioValido(): boolean {
    if (!this.familia.endereco || !this.familia.bairro || !this.familia.telefone) {
      window.alert('Por favor, preencha todas as informações da família.');
      return false;
    }

    for (let indice = 0; indice < this.membros.length; indice += 1) {
      const membro = this.membros[indice];
      if (!membro.nome || !membro.nascimento || !membro.papel || !membro.probabilidade) {
        window.alert(`Preencha todos os campos obrigatórios do ${indice + 1}º membro da família.`);
        return false;
      }
    }

    return true;
  }

  private gerarDadosFamilia(incluirIdade = true): PreviaFamilia {
    const membros: PreviaMembro[] = this.membros.map(membro => ({
      ...membro,
      idade: incluirIdade ? this.calcularIdade(membro.nascimento) : null
    }));

    return {
      nomeFamilia: this.familia.nome,
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

      const dados: PreviaFamilia = JSON.parse(rascunho);
      this.familia = {
        nome: dados.nomeFamilia || '',
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        telefone: dados.telefone || ''
      };

      if (dados.membros && dados.membros.length > 0) {
        this.membros = dados.membros.map((membro, indice) => ({
          nome: membro.nome,
          nascimento: membro.nascimento,
          profissao: membro.profissao,
          papel: indice === 0 ? 'Responsável' : membro.papel || 'Membro',
          probabilidade: membro.probabilidade
        }));
      }
    } catch (erro) {
      console.error('Erro ao carregar rascunho', erro);
    }
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
