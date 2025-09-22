package com.gestorpolitico.dto;

public class EnderecoResponseDTO {
  private Long id;
  private String rua;
  private String numero;
  private String cep;
  private String bairro;
  private String regiao;
  private String cidade;
  private String uf;
  private Double latitude;
  private Double longitude;

  public EnderecoResponseDTO() {}

  public EnderecoResponseDTO(
    Long id,
    String rua,
    String numero,
    String cep,
    String bairro,
    String regiao,
    String cidade,
    String uf,
    Double latitude,
    Double longitude
  ) {
    this.id = id;
    this.rua = rua;
    this.numero = numero;
    this.cep = cep;
    this.bairro = bairro;
    this.regiao = regiao;
    this.cidade = cidade;
    this.uf = uf;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
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

  public String getCep() {
    return cep;
  }

  public void setCep(String cep) {
    this.cep = cep;
  }

  public String getBairro() {
    return bairro;
  }

  public void setBairro(String bairro) {
    this.bairro = bairro;
  }

  public String getRegiao() {
    return regiao;
  }

  public void setRegiao(String regiao) {
    this.regiao = regiao;
  }

  public String getCidade() {
    return cidade;
  }

  public void setCidade(String cidade) {
    this.cidade = cidade;
  }

  public String getUf() {
    return uf;
  }

  public void setUf(String uf) {
    this.uf = uf;
  }

  public Double getLatitude() {
    return latitude;
  }

  public void setLatitude(Double latitude) {
    this.latitude = latitude;
  }

  public Double getLongitude() {
    return longitude;
  }

  public void setLongitude(Double longitude) {
    this.longitude = longitude;
  }
}
