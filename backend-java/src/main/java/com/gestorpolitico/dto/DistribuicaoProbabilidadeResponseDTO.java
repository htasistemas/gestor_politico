package com.gestorpolitico.dto;

public class DistribuicaoProbabilidadeResponseDTO {
  private final String probabilidade;
  private final long quantidade;

  public DistribuicaoProbabilidadeResponseDTO(String probabilidade, long quantidade) {
    this.probabilidade = probabilidade;
    this.quantidade = quantidade;
  }

  public String getProbabilidade() {
    return probabilidade;
  }

  public long getQuantidade() {
    return quantidade;
  }
}
