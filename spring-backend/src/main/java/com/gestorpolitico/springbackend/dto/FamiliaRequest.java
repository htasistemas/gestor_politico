package com.gestorpolitico.springbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class FamiliaRequest {
  @NotBlank(message = "O endereço é obrigatório.")
  @Size(max = 255, message = "O endereço deve ter no máximo 255 caracteres.")
  private String endereco;

  @NotBlank(message = "O bairro é obrigatório.")
  @Size(max = 120, message = "O bairro deve ter no máximo 120 caracteres.")
  private String bairro;

  @NotBlank(message = "O telefone é obrigatório.")
  @Size(max = 30, message = "O telefone deve ter no máximo 30 caracteres.")
  private String telefone;

  @NotEmpty(message = "Informe ao menos um membro da família.")
  @Valid
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

  @AssertTrue(message = "Defina um responsável principal para a família.")
  public boolean isPossuiResponsavelPrincipal() {
    if (membros == null || membros.isEmpty()) {
      return false;
    }
    return membros.stream()
      .filter(membro -> membro != null)
      .anyMatch(membro -> Boolean.TRUE.equals(membro.getResponsavelPrincipal()));
  }
}
