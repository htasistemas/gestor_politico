package com.gestorpolitico.dto;

public class DashboardResumoResponseDTO {
  private final long totalCadastrados;
  private final Long metaTotalPessoas;

  public DashboardResumoResponseDTO(long totalCadastrados, Long metaTotalPessoas) {
    this.totalCadastrados = totalCadastrados;
    this.metaTotalPessoas = metaTotalPessoas;
  }

  public long getTotalCadastrados() {
    return totalCadastrados;
  }

  public Long getMetaTotalPessoas() {
    return metaTotalPessoas;
  }
}
