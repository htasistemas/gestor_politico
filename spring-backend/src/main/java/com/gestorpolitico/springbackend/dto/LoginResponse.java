package com.gestorpolitico.springbackend.dto;

public class LoginResponse {
  private final boolean success;
  private final String message;
  private final UsuarioDto user;

  public LoginResponse(boolean success, String message, UsuarioDto user) {
    this.success = success;
    this.message = message;
    this.user = user;
  }

  public boolean isSuccess() {
    return success;
  }

  public String getMessage() {
    return message;
  }

  public UsuarioDto getUser() {
    return user;
  }

  public static class UsuarioDto {
    private final Long id;
    private final String usuario;
    private final String nome;

    public UsuarioDto(Long id, String usuario, String nome) {
      this.id = id;
      this.usuario = usuario;
      this.nome = nome;
    }

    public Long getId() {
      return id;
    }

    public String getUsuario() {
      return usuario;
    }

    public String getNome() {
      return nome;
    }
  }
}
