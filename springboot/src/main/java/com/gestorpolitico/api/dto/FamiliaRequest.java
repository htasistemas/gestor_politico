package com.gestorpolitico.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class FamiliaRequest {
  @NotBlank
  private String endereco;

  @NotBlank
  private String bairro;

  @NotBlank
  private String telefone;

  @Valid
  @NotEmpty
  private List<MembroFamiliaRequest> membros;

  public String getEndereco() {
    return endereco;
  }

  public void setEndereco(String endereco) {
    this.endereco = endereco;
  }

  public String getBairro() {
    return bairro;
  }

  public void setBairro(String bairro) {
    this.bairro = bairro;
  }

  public String getTelefone() {
    return telefone;
  }

  public void setTelefone(String telefone) {
    this.telefone = telefone;
  }

  public List<MembroFamiliaRequest> getMembros() {
    return membros;
  }

  public void setMembros(List<MembroFamiliaRequest> membros) {
    this.membros = membros;
  }
}
