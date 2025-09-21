package com.gestorpolitico.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequestDTO {
  @NotBlank(message = "O usuário é obrigatório.")
  @Email(message = "Informe um e-mail válido.")
  private String usuario;

  @NotBlank(message = "A senha é obrigatória.")
  @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres.")
  private String senha;

  public LoginRequestDTO() {
  }

  public LoginRequestDTO(String usuario, String senha) {
    this.usuario = usuario;
    this.senha = senha;
  }

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
