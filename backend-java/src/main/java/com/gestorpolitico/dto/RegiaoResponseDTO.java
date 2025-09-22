package com.gestorpolitico.dto;

public class RegiaoResponseDTO {
  private Long id;
  private String nome;
  private Long quantidadeBairros;

  public RegiaoResponseDTO() {}

  public RegiaoResponseDTO(Long id, String nome, Long quantidadeBairros) {
    this.id = id;
    this.nome = nome;
    this.quantidadeBairros = quantidadeBairros;
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

  public Long getQuantidadeBairros() {
    return quantidadeBairros;
  }

  public void setQuantidadeBairros(Long quantidadeBairros) {
    this.quantidadeBairros = quantidadeBairros;
  }
}
