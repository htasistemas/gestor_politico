package com.gestorpolitico.dto;

public class DashboardMetaResponseDTO {
  private final Long metaTotalPessoas;

  public DashboardMetaResponseDTO(Long metaTotalPessoas) {
    this.metaTotalPessoas = metaTotalPessoas;
  }

  public Long getMetaTotalPessoas() {
    return metaTotalPessoas;
  }
}
