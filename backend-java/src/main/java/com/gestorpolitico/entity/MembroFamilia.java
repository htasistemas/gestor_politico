package com.gestorpolitico.entity;

import com.gestorpolitico.enums.Parentesco;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "membro_familia")
public class MembroFamilia {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Size(max = 255)
  @Column(name = "nome_completo", nullable = false, length = 255)
  private String nomeCompleto;

  @Column(name = "data_nascimento")
  private LocalDate dataNascimento;

  @Size(max = 255)
  private String profissao;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Parentesco parentesco;

  @NotNull
  @Column(name = "responsavel_principal", nullable = false)
  private Boolean responsavelPrincipal = Boolean.FALSE;

  @NotBlank
  @Column(name = "probabilidade_voto", nullable = false)
  private String probabilidadeVoto;

  @Size(max = 30)
  private String telefone;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "familia_id", nullable = false)
  private Familia familia;

  @Column(name = "criado_em", nullable = false)
  private OffsetDateTime criadoEm = OffsetDateTime.now();

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

  public Boolean getResponsavelPrincipal() {
    return responsavelPrincipal;
  }

  public void setResponsavelPrincipal(Boolean responsavelPrincipal) {
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

  public Familia getFamilia() {
    return familia;
  }

  public void setFamilia(Familia familia) {
    this.familia = familia;
  }

  public OffsetDateTime getCriadoEm() {
    return criadoEm;
  }

  public void setCriadoEm(OffsetDateTime criadoEm) {
    this.criadoEm = criadoEm;
  }

  @PrePersist
  public void prePersist() {
    if (criadoEm == null) {
      criadoEm = OffsetDateTime.now();
    }
  }
}
