package com.gestorpolitico.dto;

import com.gestorpolitico.enums.Parentesco;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class MembroFamiliaResponseDTO {
  private Long id;
  private String nomeCompleto;
  private LocalDate dataNascimento;
  private String profissao;
  private Parentesco parentesco;
  private boolean responsavelPrincipal;
  private String probabilidadeVoto;
  private String telefone;
  private OffsetDateTime criadoEm;

  public MembroFamiliaResponseDTO() {
  }

  public MembroFamiliaResponseDTO(
    Long id,
    String nomeCompleto,
    LocalDate dataNascimento,
    String profissao,
    Parentesco parentesco,
    boolean responsavelPrincipal,
    String probabilidadeVoto,
    String telefone,
    OffsetDateTime criadoEm
  ) {
    this.id = id;
    this.nomeCompleto = nomeCompleto;
    this.dataNascimento = dataNascimento;
    this.profissao = profissao;
    this.parentesco = parentesco;
    this.responsavelPrincipal = responsavelPrincipal;
    this.probabilidadeVoto = probabilidadeVoto;
    this.telefone = telefone;
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

  public Parentesco getParentesco() {
    return parentesco;
  }

  public void setParentesco(Parentesco parentesco) {
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

  public OffsetDateTime getCriadoEm() {
    return criadoEm;
  }

  public void setCriadoEm(OffsetDateTime criadoEm) {
    this.criadoEm = criadoEm;
  }
}
