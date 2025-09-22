package com.gestorpolitico.dto;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class FamiliaResponseDTO {
  private Long id;
  private String endereco;
  private String bairro;
  private String telefone;
  private OffsetDateTime criadoEm;
  private EnderecoResponseDTO enderecoDetalhado;
  private List<MembroFamiliaResponseDTO> membros = new ArrayList<>();

  public FamiliaResponseDTO() {
  }

  public FamiliaResponseDTO(
    Long id,
    String endereco,
    String bairro,
    String telefone,
    OffsetDateTime criadoEm,
    EnderecoResponseDTO enderecoDetalhado,
    List<MembroFamiliaResponseDTO> membros
  ) {
    this.id = id;
    this.endereco = endereco;
    this.bairro = bairro;
    this.telefone = telefone;
    this.criadoEm = criadoEm;
    this.enderecoDetalhado = enderecoDetalhado;
    if (membros != null) {
      this.membros = membros;
    }
  }

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

  public EnderecoResponseDTO getEnderecoDetalhado() {
    return enderecoDetalhado;
  }

  public void setEnderecoDetalhado(EnderecoResponseDTO enderecoDetalhado) {
    this.enderecoDetalhado = enderecoDetalhado;
  }

  public List<MembroFamiliaResponseDTO> getMembros() {
    return membros;
  }

  public void setMembros(List<MembroFamiliaResponseDTO> membros) {
    this.membros = membros;
  }
}
