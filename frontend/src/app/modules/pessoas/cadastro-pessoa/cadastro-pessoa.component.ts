import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { LocalidadesService, Bairro, Cidade, Regiao } from '../../shared/services/localidades.service';
import { PessoasService, PessoaPayload } from '../pessoas.service';
import { ViaCepService } from '../../shared/services/via-cep.service';

@Component({
  standalone: false,
  selector: 'app-cadastro-pessoa',
  templateUrl: './cadastro-pessoa.component.html',
  styleUrls: ['./cadastro-pessoa.component.css']
})
export class CadastroPessoaComponent implements OnInit {
  cidades: Cidade[] = [];
  regioes: Regiao[] = [];
  bairros: Bairro[] = [];

  carregandoCep = false;
  criandoNovaRegiao = false;
  criandoNovoBairro = false;
  cepNaoEncontrado = false;
  mensagemSucesso: string | null = null;

  private regiaoSelecionada: string | null = null;

  formulario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required]],
    cep: [''],
    rua: ['', [Validators.required]],
    numero: ['', [Validators.required]],
    cidadeId: [null as number | null, [Validators.required]],
    regiaoNome: [''],
    bairroId: [null as number | null],
    novoBairro: [''],
    novaRegiao: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly localidadesService: LocalidadesService,
    private readonly pessoasService: PessoasService,
    private readonly viaCepService: ViaCepService
  ) {}

  ngOnInit(): void {
    this.localidadesService.listarCidades().subscribe(cidades => {
      this.cidades = cidades;
      if (cidades.length > 0) {
        this.formulario.patchValue({ cidadeId: cidades[0].id });
        this.onCidadeChange(cidades[0].id);
      }
    });

    this.formulario.get('cidadeId')?.valueChanges.subscribe(cidadeId => {
      if (cidadeId) {
        this.onCidadeChange(cidadeId);
      }
    });
  }

  onCidadeChange(cidadeId: number): void {
    this.regiaoSelecionada = null;
    this.criandoNovaRegiao = false;
    this.criandoNovoBairro = false;
    this.formulario.patchValue({ novoBairro: '', novaRegiao: '', bairroId: null, regiaoNome: '' });

    this.localidadesService.listarRegioes(cidadeId).subscribe(regioes => {
      this.regioes = regioes;
    });

    this.carregarBairros(cidadeId, null);
  }

  carregarBairros(cidadeId: number, regiao: string | null, bairroPreferido?: string | null): void {
    this.localidadesService.listarBairros(cidadeId, regiao).subscribe(bairros => {
      this.bairros = bairros;
      if (bairroPreferido) {
        const preferido = bairroPreferido.toLowerCase();
        const encontrado = bairros.find(bairro => bairro.nome.toLowerCase() === preferido);
        if (encontrado) {
          this.formulario.patchValue({ bairroId: encontrado.id, novoBairro: '' });
          this.criandoNovoBairro = false;
        } else {
          this.criandoNovoBairro = true;
          this.formulario.patchValue({ bairroId: null, novoBairro: bairroPreferido });
        }
      }
    });
  }

  onRegiaoSelecionada(valor: string): void {
    if (valor === '__nova__') {
      this.criandoNovaRegiao = true;
      this.regiaoSelecionada = null;
      this.formulario.patchValue({ novaRegiao: '', bairroId: null, regiaoNome: '' });
      this.bairros = [];
      return;
    }

    this.criandoNovaRegiao = false;
    this.regiaoSelecionada = valor || null;
    this.formulario.patchValue({ regiaoNome: this.regiaoSelecionada || '', novaRegiao: '' });
    const cidadeId = this.formulario.get('cidadeId')?.value;
    if (cidadeId) {
      this.carregarBairros(cidadeId, this.regiaoSelecionada);
    }
  }

  onBairroSelecionado(valor: string): void {
    if (valor === '__novo__') {
      this.criandoNovoBairro = true;
      this.formulario.patchValue({ bairroId: null });
      return;
    }

    this.criandoNovoBairro = false;
    const id = valor ? Number(valor) : null;
    this.formulario.patchValue({ bairroId: id, novoBairro: '' });
  }

  buscarCep(): void {
    const cep = this.formulario.get('cep')?.value || '';
    if (!cep || String(cep).replace(/\D/g, '').length !== 8) {
      return;
    }

    this.carregandoCep = true;
    this.viaCepService
      .buscarCep(cep)
      .pipe(finalize(() => (this.carregandoCep = false)))
      .subscribe(resposta => {
        if (!resposta) {
          this.cepNaoEncontrado = true;
          return;
        }
        this.cepNaoEncontrado = false;
        this.formulario.patchValue({ rua: resposta.logradouro, novoBairro: '', bairroId: null });
        this.criandoNovoBairro = false;

        const cidadeCorrespondente = this.cidades.find(
          cidade =>
            cidade.nome.toLowerCase() === resposta.localidade.toLowerCase() &&
            cidade.uf.toLowerCase() === resposta.uf.toLowerCase()
        );

        if (cidadeCorrespondente) {
          this.formulario.patchValue({ cidadeId: cidadeCorrespondente.id });
          this.regiaoSelecionada = null;
          this.criandoNovaRegiao = false;
          this.carregarBairros(cidadeCorrespondente.id, null, resposta.bairro || null);
        } else {
          this.criandoNovoBairro = !!resposta.bairro;
          if (this.criandoNovoBairro) {
            this.formulario.patchValue({ novoBairro: resposta.bairro });
          }
        }
      });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const cidadeId = this.formulario.get('cidadeId')?.value;
    if (!cidadeId) {
      return;
    }

    const novaRegiao = this.criandoNovaRegiao
      ? this.formulario.value.novaRegiao?.trim() || null
      : this.criandoNovoBairro && this.regiaoSelecionada
      ? this.regiaoSelecionada
      : null;

    const payload: PessoaPayload = {
      nome: this.formulario.value.nome?.trim() || '',
      cpf: this.formulario.value.cpf || '',
      cep: this.formulario.value.cep || null,
      rua: this.formulario.value.rua?.trim() || '',
      numero: this.formulario.value.numero?.trim() || '',
      cidadeId,
      bairroId: this.criandoNovoBairro ? null : this.formulario.value.bairroId,
      novoBairro: this.criandoNovoBairro ? this.formulario.value.novoBairro?.trim() || null : null,
      novaRegiao
    };

    if (this.criandoNovaRegiao && !payload.novaRegiao) {
      window.alert('Informe o nome da nova região.');
      return;
    }

    if (this.criandoNovoBairro && !payload.novoBairro) {
      window.alert('Informe o nome do novo bairro.');
      return;
    }

    this.pessoasService.criarPessoa(payload).subscribe({
      next: resposta => {
        this.mensagemSucesso = `Pessoa ${resposta.nome} cadastrada com sucesso!`;
        this.limparFormulario(true);
      },
      error: () => {
        window.alert('Não foi possível cadastrar a pessoa. Verifique os dados informados.');
      }
    });
  }

  limparFormulario(preservarMensagem = false): void {
    this.formulario.reset();
    this.criandoNovaRegiao = false;
    this.criandoNovoBairro = false;
    this.regiaoSelecionada = null;
    if (!preservarMensagem) {
      this.mensagemSucesso = null;
    }
    if (this.cidades.length > 0) {
      const primeira = this.cidades[0];
      this.formulario.patchValue({ cidadeId: primeira.id });
      this.onCidadeChange(primeira.id);
    }
  }
}
