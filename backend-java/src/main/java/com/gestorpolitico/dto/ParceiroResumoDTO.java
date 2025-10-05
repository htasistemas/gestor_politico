package com.gestorpolitico.dto;

public class ParceiroResumoDTO {
  private Long id;
  private String nome;
  private String token;

  public ParceiroResumoDTO() {}

  public ParceiroResumoDTO(Long id, String nome, String token) {
    this.id = id;
    this.nome = nome;
    this.token = token;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }
}
