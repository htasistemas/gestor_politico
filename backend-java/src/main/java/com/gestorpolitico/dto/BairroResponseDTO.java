package com.gestorpolitico.dto;

public class BairroResponseDTO {
  private Long id;
  private String nome;
  private String regiao;

  public BairroResponseDTO() {}

  public BairroResponseDTO(Long id, String nome, String regiao) {
    this.id = id;
    this.nome = nome;
    this.regiao = regiao;
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

  public String getRegiao() {
    return regiao;
  }

  public void setRegiao(String regiao) {
    this.regiao = regiao;
  }
}
