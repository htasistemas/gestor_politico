package com.gestorpolitico.dto;

public class CidadeResponseDTO {
  private Long id;
  private String nome;
  private String uf;

  public CidadeResponseDTO() {}

  public CidadeResponseDTO(Long id, String nome, String uf) {
    this.id = id;
    this.nome = nome;
    this.uf = uf;
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

  public String getUf() {
    return uf;
  }

  public void setUf(String uf) {
    this.uf = uf;
  }
}
