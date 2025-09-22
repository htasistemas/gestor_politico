package com.gestorpolitico.dto;

import com.gestorpolitico.entity.PerfilUsuario;

public class LoginResponseDTO {
  private Long id;
  private String usuario;
  private String nome;
  private PerfilUsuario perfil;

  public LoginResponseDTO() {
  }

  public LoginResponseDTO(Long id, String usuario, String nome, PerfilUsuario perfil) {
    this.id = id;
    this.usuario = usuario;
    this.nome = nome;
    this.perfil = perfil;
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

  public PerfilUsuario getPerfil() {
    return perfil;
  }

  public void setPerfil(PerfilUsuario perfil) {
    this.perfil = perfil;
  }
}
