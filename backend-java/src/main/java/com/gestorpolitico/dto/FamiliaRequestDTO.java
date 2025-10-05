package com.gestorpolitico.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class FamiliaRequestDTO {
  @Size(max = 9, message = "O CEP deve ter no máximo 9 caracteres.")
  private String cep;

  @NotBlank(message = "Informe a rua da família.")
  @Size(max = 255, message = "A rua deve ter no máximo 255 caracteres.")
  private String rua;

  @NotBlank(message = "Informe o número do endereço da família.")
  @Size(max = 30, message = "O número deve ter no máximo 30 caracteres.")
  private String numero;

  @NotNull(message = "Selecione a cidade da família.")
  private Long cidadeId;

  @Size(max = 120, message = "A região deve ter no máximo 120 caracteres.")
  private String novaRegiao;

  @NotEmpty(message = "Informe ao menos um membro da família.")
  @Valid
  private List<MembroFamiliaRequestDTO> membros;

  private String parceiroToken;

  public FamiliaRequestDTO() {
  }

  public String getCep() {
    return cep;
  }

  public void setCep(String cep) {
    this.cep = cep;
  }

  public String getRua() {
    return rua;
  }

  public void setRua(String rua) {
    this.rua = rua;
  }

  public String getNumero() {
    return numero;
  }

  public void setNumero(String numero) {
    this.numero = numero;
  }

  public Long getCidadeId() {
    return cidadeId;
  }

  public void setCidadeId(Long cidadeId) {
    this.cidadeId = cidadeId;
  }

  public String getNovaRegiao() {
    return novaRegiao;
  }

  public void setNovaRegiao(String novaRegiao) {
    this.novaRegiao = novaRegiao;
  }

  public List<MembroFamiliaRequestDTO> getMembros() {
    return membros;
  }

  public void setMembros(List<MembroFamiliaRequestDTO> membros) {
    this.membros = membros;
  }

  public String getParceiroToken() {
    return parceiroToken;
  }

  public void setParceiroToken(String parceiroToken) {
    this.parceiroToken = parceiroToken;
  }
}
