import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  LocalidadesService,
  Bairro,
  Cidade,
  ImportacaoBairrosResposta,
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
  mensagemImportacao: string | null = null;
  carregandoImportacao = false;

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

  regiaoLivreForm = this.fb.group({
    nomeRegiaoLivre: ['', [Validators.required, Validators.minLength(3)]],
    bairrosIds: [[] as number[]]
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
    this.mensagemImportacao = null;
    this.regiaoForm.reset();
    this.atribuicaoForm.reset();
    this.regiaoLivreForm.reset();
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

  importarBairros(): void {
    if (!this.cidadeSelecionadaId) {
      return;
    }

    this.carregandoImportacao = true;
    this.localidadesService
      .importarBairros(this.cidadeSelecionadaId)
      .pipe(finalize(() => (this.carregandoImportacao = false)))
      .subscribe((resposta: ImportacaoBairrosResposta) => {
        this.mensagemImportacao =
          resposta.bairrosInseridos > 0
            ? `${resposta.bairrosInseridos} bairros importados com sucesso. ${resposta.bairrosIgnorados} já existiam.`
            : 'Nenhum novo bairro encontrado para importação.';
        this.carregarBairros();
        this.carregarRegioes();
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

  atualizarSelecaoBairros(event: Event, controle: 'atribuicao' | 'livre'): void {
    const options = Array.from((event.target as HTMLSelectElement).selectedOptions);
    const ids = options.map(option => Number(option.value));
    if (controle === 'atribuicao') {
      this.atribuicaoForm.patchValue({ bairrosIds: ids });
    } else {
      this.regiaoLivreForm.patchValue({ bairrosIds: ids });
    }
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

  atribuirRegiaoLivre(): void {
    if (this.regiaoLivreForm.invalid || !this.cidadeSelecionadaId) {
      this.regiaoLivreForm.markAllAsTouched();
      return;
    }
    const nomeRegiao = this.regiaoLivreForm.value.nomeRegiaoLivre?.trim();
    const bairrosIds = this.regiaoLivreForm.value.bairrosIds ?? [];
    if (!nomeRegiao || bairrosIds.length === 0) {
      window.alert('Informe um nome de região e selecione ao menos um bairro.');
      return;
    }

    this.localidadesService
      .atualizarRegiaoBairros({ bairrosIds, nomeRegiaoLivre: nomeRegiao })
      .subscribe(() => {
        this.regiaoLivreForm.reset();
        this.carregarBairros();
        this.carregarRegioes();
      });
  }

  removerRegiaoDosBairros(): void {
    if (!this.cidadeSelecionadaId) {
      return;
    }
    const bairrosIds = this.regiaoLivreForm.value.bairrosIds ?? [];
    if (bairrosIds.length === 0) {
      window.alert('Selecione os bairros que terão a região removida.');
      return;
    }

    this.localidadesService
      .atualizarRegiaoBairros({ bairrosIds, regiaoId: null })
      .subscribe(() => {
        this.regiaoLivreForm.reset();
        this.carregarBairros();
        this.carregarRegioes();
      });
  }
}

function regiaoOrdenada(regioes: Regiao[]): Regiao[] {
  return [...regioes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
