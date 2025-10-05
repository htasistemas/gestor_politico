import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  LocalidadesService,
  Bairro,
  Cidade,
  Regiao
} from '../shared/services/localidades.service';

@Component({
  standalone: false,
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent implements OnInit {
  cidades: Cidade[] = [];
  regioes: Regiao[] = [];
  bairros: Bairro[] = [];

  cidadeSelecionadaId: number | null = null;
  mensagemUnificacao: string | null = null;
  processandoUnificacao = false;

  get possuiRegioesNaoCadastradas(): boolean {
    return this.regioes.some(regiao => regiao.id === null);
  }

  regiaoForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]]
  });

  atribuicaoForm = this.fb.group({
    regiaoId: [null as number | null, Validators.required],
    bairrosIds: [[] as number[]]
  });

  unificacaoForm = this.fb.group({
    bairroPrincipalId: [null as number | null, Validators.required],
    bairrosDuplicadosIds: [[] as number[]]
  });

  constructor(
    private readonly localidadesService: LocalidadesService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.localidadesService.listarCidades().subscribe(cidades => {
      this.cidades = cidades;
      if (cidades.length > 0) {
        this.selecionarCidade(cidades[0].id);
      }
    });
  }

  selecionarCidade(cidadeId: number): void {
    this.cidadeSelecionadaId = cidadeId;
    this.mensagemUnificacao = null;
    this.regiaoForm.reset();
    this.atribuicaoForm.reset();
    this.unificacaoForm.reset();
    this.carregarRegioes();
    this.carregarBairros();
  }

  carregarRegioes(): void {
    if (!this.cidadeSelecionadaId) {
      this.regioes = [];
      return;
    }
    this.localidadesService.listarRegioes(this.cidadeSelecionadaId).subscribe(regioes => {
      this.regioes = regiaoOrdenada(regioes);
    });
  }

  carregarBairros(): void {
    if (!this.cidadeSelecionadaId) {
      this.bairros = [];
      return;
    }
    this.localidadesService.listarBairros(this.cidadeSelecionadaId).subscribe(bairros => {
      this.bairros = bairros;
    });
  }

  criarRegiao(): void {
    if (!this.cidadeSelecionadaId || this.regiaoForm.invalid) {
      this.regiaoForm.markAllAsTouched();
      return;
    }

    const nome = this.regiaoForm.value.nome?.trim();
    if (!nome) {
      return;
    }

    this.localidadesService.criarRegiao(this.cidadeSelecionadaId, nome).subscribe(() => {
      this.regiaoForm.reset();
      this.carregarRegioes();
    });
  }

  atualizarSelecaoBairros(event: Event): void {
    const options = Array.from((event.target as HTMLSelectElement).selectedOptions);
    const ids = options.map(option => Number(option.value));
    this.atribuicaoForm.patchValue({ bairrosIds: ids });
  }

  atualizarDuplicados(event: Event): void {
    const options = Array.from((event.target as HTMLSelectElement).selectedOptions);
    const ids = options.map(option => Number(option.value));
    this.unificacaoForm.patchValue({ bairrosDuplicadosIds: ids });
  }

  aoAlterarBairroPrincipal(): void {
    const principalId = this.unificacaoForm.value.bairroPrincipalId ?? null;
    const duplicados = (this.unificacaoForm.value.bairrosDuplicadosIds ?? []).filter(
      id => id !== principalId
    );
    this.unificacaoForm.patchValue({ bairrosDuplicadosIds: duplicados });
  }

  atribuirRegiaoExistente(): void {
    if (this.atribuicaoForm.invalid || !this.cidadeSelecionadaId) {
      this.atribuicaoForm.markAllAsTouched();
      return;
    }

    const regiaoId = this.atribuicaoForm.value.regiaoId;
    const bairrosIds = this.atribuicaoForm.value.bairrosIds ?? [];
    if (!regiaoId || bairrosIds.length === 0) {
      window.alert('Selecione pelo menos um bairro para vincular.');
      return;
    }

    this.localidadesService.atribuirRegiao(regiaoId, bairrosIds).subscribe(() => {
      this.atribuicaoForm.reset();
      this.carregarBairros();
      this.carregarRegioes();
    });
  }

  unificarBairros(): void {
    if (this.unificacaoForm.invalid) {
      this.unificacaoForm.markAllAsTouched();
      return;
    }

    const bairroPrincipalId = this.unificacaoForm.value.bairroPrincipalId;
    const bairrosDuplicadosIds = this.unificacaoForm.value.bairrosDuplicadosIds ?? [];

    if (!bairroPrincipalId || bairrosDuplicadosIds.length === 0) {
      window.alert('Selecione o bairro principal e ao menos um duplicado para unificar.');
      return;
    }

    this.mensagemUnificacao = null;
    this.processandoUnificacao = true;
    this.localidadesService
      .unificarBairros({ bairroPrincipalId, bairrosDuplicadosIds })
      .subscribe({
        next: () => {
          this.processandoUnificacao = false;
          this.mensagemUnificacao = 'Bairros unificados com sucesso.';
          this.unificacaoForm.reset();
          this.carregarBairros();
          this.carregarRegioes();
        },
        error: () => {
          this.processandoUnificacao = false;
          window.alert('Não foi possível unificar os bairros selecionados. Tente novamente.');
        }
      });
  }
}

function regiaoOrdenada(regioes: Regiao[]): Regiao[] {
  return [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
