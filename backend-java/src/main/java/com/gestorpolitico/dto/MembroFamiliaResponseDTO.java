package com.gestorpolitico.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class MembroFamiliaResponseDTO {
  private Long id;
  private String nomeCompleto;
  private String cpf;
  private LocalDate dataNascimento;
  private String profissao;
  private String parentesco;
  private boolean responsavelPrincipal;
  private String probabilidadeVoto;
  private String telefone;
  private String cep;
  private EnderecoResponseDTO endereco;
  private OffsetDateTime criadoEm;

  public MembroFamiliaResponseDTO() {
  }

  public MembroFamiliaResponseDTO(
    Long id,
    String nomeCompleto,
    String cpf,
    LocalDate dataNascimento,
    String profissao,
    String parentesco,
    boolean responsavelPrincipal,
    String probabilidadeVoto,
    String telefone,
    String cep,
    EnderecoResponseDTO endereco,
    OffsetDateTime criadoEm
  ) {
    this.id = id;
    this.nomeCompleto = nomeCompleto;
    this.cpf = cpf;
    this.dataNascimento = dataNascimento;
    this.profissao = profissao;
    this.parentesco = parentesco;
    this.responsavelPrincipal = responsavelPrincipal;
    this.probabilidadeVoto = probabilidadeVoto;
    this.telefone = telefone;
    this.cep = cep;
    this.endereco = endereco;
    this.criadoEm = criadoEm;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNomeCompleto() {
    return nomeCompleto;
  }

  public void setNomeCompleto(String nomeCompleto) {
    this.nomeCompleto = nomeCompleto;
  }

  public String getCpf() {
    return cpf;
  }

  public void setCpf(String cpf) {
    this.cpf = cpf;
  }

  public LocalDate getDataNascimento() {
    return dataNascimento;
  }

  public void setDataNascimento(LocalDate dataNascimento) {
    this.dataNascimento = dataNascimento;
  }

  public String getProfissao() {
    return profissao;
  }

  public void setProfissao(String profissao) {
    this.profissao = profissao;
  }

  public String getParentesco() {
    return parentesco;
  }

  public void setParentesco(String parentesco) {
    this.parentesco = parentesco;
  }

  public boolean isResponsavelPrincipal() {
    return responsavelPrincipal;
  }

  public void setResponsavelPrincipal(boolean responsavelPrincipal) {
    this.responsavelPrincipal = responsavelPrincipal;
  }

  public String getProbabilidadeVoto() {
    return probabilidadeVoto;
  }

  public void setProbabilidadeVoto(String probabilidadeVoto) {
    this.probabilidadeVoto = probabilidadeVoto;
  }

  public String getTelefone() {
    return telefone;
  }

  public void setTelefone(String telefone) {
    this.telefone = telefone;
  }

  public String getCep() {
    return cep;
  }

  public void setCep(String cep) {
    this.cep = cep;
  }

  public EnderecoResponseDTO getEndereco() {
    return endereco;
  }

  public void setEndereco(EnderecoResponseDTO endereco) {
    this.endereco = endereco;
  }

  public OffsetDateTime getCriadoEm() {
    return criadoEm;
  }

  public void setCriadoEm(OffsetDateTime criadoEm) {
    this.criadoEm = criadoEm;
  }
}
