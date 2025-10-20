package com.gestorpolitico.dto;

public class DashboardAniversarianteResponseDTO {
  private final Long id;
  private final String nome;
  private final int dia;
  private final int mes;
  private final String bairro;
  private final String telefone;

  public DashboardAniversarianteResponseDTO(
    Long id,
    String nome,
    int dia,
    int mes,
    String bairro,
    String telefone
  ) {
    this.id = id;
    this.nome = nome;
    this.dia = dia;
    this.mes = mes;
    this.bairro = bairro;
    this.telefone = telefone;
  }

  public Long getId() {
    return id;
  }

  public String getNome() {
    return nome;
  }

  public int getDia() {
    return dia;
  }

  public int getMes() {
    return mes;
  }

  public String getBairro() {
    return bairro;
  }

  public String getTelefone() {
    return telefone;
  }
}
