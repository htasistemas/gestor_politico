package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class RegiaoAtribuicaoRequestDTO {
  @NotEmpty
  private List<Long> bairrosIds;

  public List<Long> getBairrosIds() {
    return bairrosIds;
  }

  public void setBairrosIds(List<Long> bairrosIds) {
    this.bairrosIds = bairrosIds;
  }
}
