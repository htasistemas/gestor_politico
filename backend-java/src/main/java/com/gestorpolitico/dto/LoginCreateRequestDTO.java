package com.gestorpolitico.dto;

import com.gestorpolitico.entity.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LoginCreateRequestDTO {
  @NotBlank(message = "O usuário é obrigatório.")
  @Email(message = "Informe um e-mail válido.")
  private String usuario;

  @NotBlank(message = "O nome é obrigatório.")
  private String nome;

  @NotBlank(message = "A senha é obrigatória.")
  @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres.")
  private String senha;

  @NotNull(message = "O perfil é obrigatório.")
  private PerfilUsuario perfil;

  public String getUsuario() {
    return usuario;
  }

  public void setUsuario(String usuario) {
    this.usuario = usuario;
  }

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getSenha() {
    return senha;
  }

  public void setSenha(String senha) {
    this.senha = senha;
  }

  public PerfilUsuario getPerfil() {
    return perfil;
  }

  public void setPerfil(PerfilUsuario perfil) {
    this.perfil = perfil;
  }
}
