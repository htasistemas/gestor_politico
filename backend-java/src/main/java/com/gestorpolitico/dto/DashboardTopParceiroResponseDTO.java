package com.gestorpolitico.dto;

public class DashboardTopParceiroResponseDTO {
  private final Long parceiroId;
  private final String nome;
  private final long totalFamilias;

  public DashboardTopParceiroResponseDTO(Long parceiroId, String nome, long totalFamilias) {
    this.parceiroId = parceiroId;
    this.nome = nome;
    this.totalFamilias = totalFamilias;
  }

  public Long getParceiroId() {
    return parceiroId;
  }

  public String getNome() {
    return nome;
  }

  public long getTotalFamilias() {
    return totalFamilias;
  }
}
