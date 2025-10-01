package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class UnificarBairrosRequestDTO {
  @NotNull(message = "Informe o bairro principal")
  private Long bairroPrincipalId;

  @NotEmpty(message = "Selecione os bairros duplicados")
  private List<Long> bairrosDuplicadosIds;

  public Long getBairroPrincipalId() {
    return bairroPrincipalId;
  }

  public void setBairroPrincipalId(Long bairroPrincipalId) {
    this.bairroPrincipalId = bairroPrincipalId;
  }

  public List<Long> getBairrosDuplicadosIds() {
    return bairrosDuplicadosIds;
  }

  public void setBairrosDuplicadosIds(List<Long> bairrosDuplicadosIds) {
    this.bairrosDuplicadosIds = bairrosDuplicadosIds;
  }
}
