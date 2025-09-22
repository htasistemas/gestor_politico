package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class AtualizarRegiaoBairrosRequestDTO {
  @NotEmpty
  private List<Long> bairrosIds;
  private Long regiaoId;
  private String nomeRegiaoLivre;

  public List<Long> getBairrosIds() {
    return bairrosIds;
  }

  public void setBairrosIds(List<Long> bairrosIds) {
    this.bairrosIds = bairrosIds;
  }

  public Long getRegiaoId() {
    return regiaoId;
  }

  public void setRegiaoId(Long regiaoId) {
    this.regiaoId = regiaoId;
  }

  public String getNomeRegiaoLivre() {
    return nomeRegiaoLivre;
  }

  public void setNomeRegiaoLivre(String nomeRegiaoLivre) {
    this.nomeRegiaoLivre = nomeRegiaoLivre;
  }
}
