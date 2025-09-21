package com.gestorpolitico.dto;

public class LoginResponseDTO {
  private Long id;
  private String usuario;
  private String nome;

  public LoginResponseDTO() {
  }

  public LoginResponseDTO(Long id, String usuario, String nome) {
    this.id = id;
    this.usuario = usuario;
    this.nome = nome;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

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
}
