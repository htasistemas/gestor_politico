package com.gestorpolitico.dto;

public class ImportacaoBairrosResponseDTO {
  private Long cidadeId;
  private int bairrosInseridos;
  private int bairrosIgnorados;

  public ImportacaoBairrosResponseDTO() {}

  public ImportacaoBairrosResponseDTO(Long cidadeId, int bairrosInseridos, int bairrosIgnorados) {
    this.cidadeId = cidadeId;
    this.bairrosInseridos = bairrosInseridos;
    this.bairrosIgnorados = bairrosIgnorados;
  }

  public Long getCidadeId() {
    return cidadeId;
  }

  public void setCidadeId(Long cidadeId) {
    this.cidadeId = cidadeId;
  }

  public int getBairrosInseridos() {
    return bairrosInseridos;
  }

  public void setBairrosInseridos(int bairrosInseridos) {
    this.bairrosInseridos = bairrosInseridos;
  }

  public int getBairrosIgnorados() {
    return bairrosIgnorados;
  }

  public void setBairrosIgnorados(int bairrosIgnorados) {
    this.bairrosIgnorados = bairrosIgnorados;
  }
}
