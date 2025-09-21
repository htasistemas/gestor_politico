package com.gestorpolitico.api.dto;

public class LoginResponse {
  private boolean success;
  private UsuarioDto user;

  public LoginResponse(boolean success, UsuarioDto user) {
    this.success = success;
    this.user = user;
  }

  public boolean isSuccess() {
    return success;
  }

  public void setSuccess(boolean success) {
    this.success = success;
  }

  public UsuarioDto getUser() {
    return user;
  }

  public void setUser(UsuarioDto user) {
    this.user = user;
  }
}
