package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class DashboardMetaRequestDTO {
  @NotNull(message = "Informe o valor da meta.")
  @PositiveOrZero(message = "A meta deve ser maior ou igual a zero.")
  private Long metaTotalPessoas;

  public Long getMetaTotalPessoas() {
    return metaTotalPessoas;
  }

  public void setMetaTotalPessoas(Long metaTotalPessoas) {
    this.metaTotalPessoas = metaTotalPessoas;
  }
}
