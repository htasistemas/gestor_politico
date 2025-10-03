package com.gestorpolitico.dto;

import java.util.ArrayList;
import java.util.List;

public class FamiliaListaResponseDTO {
  private List<FamiliaResponseDTO> familias = new ArrayList<>();
  private long total;
  private int pagina;
  private int tamanho;
  private long responsaveisAtivos;
  private long novosCadastros;

  public FamiliaListaResponseDTO() {}

  public FamiliaListaResponseDTO(
    List<FamiliaResponseDTO> familias,
    long total,
    int pagina,
    int tamanho,
    long responsaveisAtivos,
    long novosCadastros
  ) {
    if (familias != null) {
      this.familias = familias;
    }
    this.total = total;
    this.pagina = pagina;
    this.tamanho = tamanho;
    this.responsaveisAtivos = responsaveisAtivos;
    this.novosCadastros = novosCadastros;
  }

  public List<FamiliaResponseDTO> getFamilias() {
    return familias;
  }

  public void setFamilias(List<FamiliaResponseDTO> familias) {
    this.familias = familias;
  }

  public long getTotal() {
    return total;
  }

  public void setTotal(long total) {
    this.total = total;
  }

  public int getPagina() {
    return pagina;
  }

  public void setPagina(int pagina) {
    this.pagina = pagina;
  }

  public int getTamanho() {
    return tamanho;
  }

  public void setTamanho(int tamanho) {
    this.tamanho = tamanho;
  }

  public long getResponsaveisAtivos() {
    return responsaveisAtivos;
  }

  public void setResponsaveisAtivos(long responsaveisAtivos) {
    this.responsaveisAtivos = responsaveisAtivos;
  }

  public long getNovosCadastros() {
    return novosCadastros;
  }

  public void setNovosCadastros(long novosCadastros) {
    this.novosCadastros = novosCadastros;
  }
}
