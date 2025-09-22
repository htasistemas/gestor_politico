import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService, PerfilUsuario } from '../shared/services/auth.service';
import { UsuariosService } from '../shared/services/usuarios.service';

@Component({
  standalone: false,
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  carregando = true;
  salvando = false;
  mensagemSucesso = '';
  mensagemErro = '';
  perfilUsuario: PerfilUsuario | null = null;

  formulario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    usuario: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.minLength(6)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.usuarioAtual;
    if (!usuario) {
      this.carregando = false;
      return;
    }

    this.perfilUsuario = usuario.perfil;
    this.usuariosService.buscarPorId(usuario.id).subscribe({
      next: dados => {
        this.formulario.patchValue({
          nome: dados.nome,
          usuario: dados.usuario
        });
        this.perfilUsuario = dados.perfil;
        this.carregando = false;
      },
        error: (erro: HttpErrorResponse) => {
          if (erro.error?.message) {
            this.mensagemErro = erro.error.message;
          } else {
            this.mensagemErro = 'Não foi possível carregar suas informações. Tente novamente mais tarde.';
          }
          this.carregando = false;
        }
      });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const usuarioAtual = this.authService.usuarioAtual;
    if (!usuarioAtual) {
      this.mensagemErro = 'Sessão expirada. Faça login novamente.';
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.salvando = true;

    const senha = this.formulario.value.senha?.trim();

    this.usuariosService
      .atualizar(usuarioAtual.id, {
        nome: this.formulario.value.nome?.trim() ?? '',
        usuario: this.formulario.value.usuario?.trim() ?? '',
        senha: senha ? senha : null
      })
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: usuarioAtualizado => {
          this.formulario.patchValue({ senha: '' });
          this.mensagemSucesso = 'Dados atualizados com sucesso!';
          this.perfilUsuario = usuarioAtualizado.perfil ?? this.perfilUsuario;
          this.authService.atualizarUsuarioLocal({
            nome: usuarioAtualizado.nome,
            usuario: usuarioAtualizado.usuario
          });
        },
        error: (erro: HttpErrorResponse) => {
          if (erro.error?.message) {
            this.mensagemErro = erro.error.message;
            return;
          }
          this.mensagemErro = 'Não foi possível salvar as alterações. Tente novamente mais tarde.';
        }
      });
  }
}
