package com.gestorpolitico.api.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class FamiliaResponse {
  private Long id;
  private String endereco;
  private String bairro;
  private String telefone;
  private OffsetDateTime criadoEm;
  private List<MembroFamiliaResponse> membros;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

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

  public OffsetDateTime getCriadoEm() {
    return criadoEm;
  }

  public void setCriadoEm(OffsetDateTime criadoEm) {
    this.criadoEm = criadoEm;
  }

  public List<MembroFamiliaResponse> getMembros() {
    return membros;
  }

  public void setMembros(List<MembroFamiliaResponse> membros) {
    this.membros = membros;
  }
}
