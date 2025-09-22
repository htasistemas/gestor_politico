import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { PerfilUsuario } from '../shared/services/auth.service';
import {
  AtualizarUsuarioPayload,
  CriarUsuarioPayload,
  UsuarioSistema,
  UsuariosService
} from '../shared/services/usuarios.service';

@Component({
  standalone: false,
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuarioSistema[] = [];
  carregando = true;
  salvando = false;
  exibindoFormulario = false;
  editando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  perfisDisponiveis: { valor: PerfilUsuario; rotulo: string }[] = [
    { valor: 'ADMINISTRADOR', rotulo: 'Administrador' },
    { valor: 'USUARIO', rotulo: 'Usuário' }
  ];

  formulario = this.fb.group({
    id: [null as number | null],
    nome: ['', [Validators.required, Validators.minLength(3)]],
    usuario: ['', [Validators.required, Validators.email]],
    perfil: ['USUARIO' as PerfilUsuario, Validators.required],
    senha: ['', [Validators.minLength(6)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly usuariosService: UsuariosService
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.usuariosService.listar().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.carregando = false;
      },
      error: () => {
        this.mensagemErro = 'Não foi possível carregar os usuários.';
        this.carregando = false;
      }
    });
  }

  abrirNovo(): void {
    this.formulario.reset({
      id: null,
      nome: '',
      usuario: '',
      perfil: 'USUARIO',
      senha: ''
    });
    this.definirValidacaoSenha(true);
    this.exibindoFormulario = true;
    this.editando = false;
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  editarUsuario(usuario: UsuarioSistema): void {
    this.formulario.reset({
      id: usuario.id,
      nome: usuario.nome,
      usuario: usuario.usuario,
      perfil: usuario.perfil,
      senha: ''
    });
    this.definirValidacaoSenha(false);
    this.exibindoFormulario = true;
    this.editando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  cancelar(): void {
    this.exibindoFormulario = false;
    this.formulario.reset();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const senha = this.formulario.value.senha?.trim();
    const payloadBase = {
      nome: this.formulario.value.nome?.trim() ?? '',
      usuario: this.formulario.value.usuario?.trim() ?? '',
      perfil: this.formulario.value.perfil ?? 'USUARIO'
    };

    if (this.editando) {
      const id = this.formulario.value.id as number;
      const payload: AtualizarUsuarioPayload = {
        ...payloadBase,
        senha: senha ? senha : null,
        perfil: payloadBase.perfil
      };

      this.usuariosService
        .atualizar(id, payload)
        .pipe(finalize(() => (this.salvando = false)))
        .subscribe({
          next: () => {
            this.mensagemSucesso = 'Usuário atualizado com sucesso!';
            this.formulario.reset();
            this.exibindoFormulario = false;
            this.carregarUsuarios();
          },
          error: erro => this.tratarErro(erro)
        });
    } else {
      const payload: CriarUsuarioPayload = {
        ...payloadBase,
        senha: senha ?? ''
      };

      this.usuariosService
        .criar(payload)
        .pipe(finalize(() => (this.salvando = false)))
        .subscribe({
          next: () => {
            this.mensagemSucesso = 'Usuário criado com sucesso!';
            this.formulario.reset();
            this.exibindoFormulario = false;
            this.carregarUsuarios();
          },
          error: erro => this.tratarErro(erro)
        });
    }
  }

  removerUsuario(usuario: UsuarioSistema): void {
    const confirmar = window.confirm(`Deseja realmente remover o usuário "${usuario.nome}"?`);
    if (!confirmar) {
      return;
    }
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.usuariosService.remover(usuario.id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Usuário removido com sucesso!';
        this.carregarUsuarios();
      },
      error: erro => this.tratarErro(erro)
    });
  }

  private definirValidacaoSenha(obrigatoria: boolean): void {
    const controle = this.formulario.get('senha');
    if (!controle) {
      return;
    }
    if (obrigatoria) {
      controle.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      controle.setValidators([Validators.minLength(6)]);
    }
    controle.updateValueAndValidity();
  }

  private tratarErro(erro: unknown): void {
    this.salvando = false;
    if (erro instanceof HttpErrorResponse && erro.error?.message) {
      this.mensagemErro = erro.error.message;
      return;
    }
    this.mensagemErro = 'Ocorreu um erro ao processar a solicitação.';
  }
}
