package com.gestorpolitico.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "familia")
public class Familia {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Size(max = 255)
  @Column(nullable = false, length = 255)
  private String endereco;

  @NotBlank
  @Size(max = 120)
  @Column(nullable = false, length = 120)
  private String bairro;

  @NotBlank
  @Size(max = 30)
  @Column(nullable = false, length = 30)
  private String telefone;

  @Column(name = "criado_em", nullable = false)
  private OffsetDateTime criadoEm = OffsetDateTime.now();

  @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "endereco_id", nullable = false)
  private Endereco enderecoDetalhado;

  @OneToMany(mappedBy = "familia", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<MembroFamilia> membros = new ArrayList<>();

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

  public Endereco getEnderecoDetalhado() {
    return enderecoDetalhado;
  }

  public void setEnderecoDetalhado(Endereco enderecoDetalhado) {
    this.enderecoDetalhado = enderecoDetalhado;
  }

  public List<MembroFamilia> getMembros() {
    return membros;
  }

  public void setMembros(List<MembroFamilia> membros) {
    this.membros = membros;
  }

  public void adicionarMembro(MembroFamilia membro) {
    membro.setFamilia(this);
    this.membros.add(membro);
  }

  @PrePersist
  public void prePersist() {
    if (criadoEm == null) {
      criadoEm = OffsetDateTime.now();
    }
  }
}
