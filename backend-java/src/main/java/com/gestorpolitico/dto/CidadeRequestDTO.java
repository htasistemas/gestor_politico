package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CidadeRequestDTO {
  @NotBlank(message = "Informe o nome da cidade.")
  @Size(max = 150, message = "O nome da cidade deve ter no máximo 150 caracteres.")
  private String nome;

  @NotBlank(message = "Informe a UF da cidade.")
  @Size(min = 2, max = 2, message = "A UF deve conter exatamente 2 caracteres.")
  private String uf;

  public CidadeRequestDTO() {}

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getUf() {
    return uf;
  }

  public void setUf(String uf) {
    this.uf = uf;
  }
}
