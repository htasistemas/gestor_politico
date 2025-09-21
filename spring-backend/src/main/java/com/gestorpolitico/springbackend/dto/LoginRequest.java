package com.gestorpolitico.springbackend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
  @NotBlank(message = "O usuário é obrigatório.")
  private String usuario;

  @NotBlank(message = "A senha é obrigatória.")
  private String senha;

  public String getUsuario() {
    return usuario;
  }

  public void setUsuario(String usuario) {
    this.usuario = usuario;
  }

  public String getSenha() {
    return senha;
  }

  public void setSenha(String senha) {
    this.senha = senha;
  }
}
