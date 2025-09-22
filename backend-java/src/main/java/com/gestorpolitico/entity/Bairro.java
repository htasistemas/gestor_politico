package com.gestorpolitico.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "bairros")
public class Bairro {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Size(max = 150)
  @Column(nullable = false, length = 150)
  private String nome;

  @Size(max = 120)
  @Column(length = 120)
  private String regiao;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "cidade_id", nullable = false)
  private Cidade cidade;

  @NotBlank
  @Column(name = "nome_normalizado", nullable = false, length = 160)
  private String nomeNormalizado;

  @PrePersist
  @PreUpdate
  public void normalizarNome() {
    if (nome != null) {
      nomeNormalizado = NomeNormalizador.normalizar(nome);
    }
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getRegiao() {
    return regiao;
  }

  public void setRegiao(String regiao) {
    this.regiao = regiao;
  }

  public Cidade getCidade() {
    return cidade;
  }

  public void setCidade(Cidade cidade) {
    this.cidade = cidade;
  }

  public String getNomeNormalizado() {
    return nomeNormalizado;
  }

  public void setNomeNormalizado(String nomeNormalizado) {
    this.nomeNormalizado = nomeNormalizado;
  }
}
