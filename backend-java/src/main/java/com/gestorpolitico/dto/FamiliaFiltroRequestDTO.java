package com.gestorpolitico.dto;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

public class FamiliaFiltroRequestDTO {
  private Long cidadeId;
  private String regiao;
  private String bairro;
  private String responsavel;
  private String probabilidadeVoto;
  private String rua;
  private String numero;
  private String cep;
  private String termo;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dataInicio;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dataFim;

  public Long getCidadeId() {
    return cidadeId;
  }

  public void setCidadeId(Long cidadeId) {
    this.cidadeId = cidadeId;
  }

  public String getRegiao() {
    return regiao;
  }

  public void setRegiao(String regiao) {
    this.regiao = regiao;
  }

  public String getBairro() {
    return bairro;
  }

  public void setBairro(String bairro) {
    this.bairro = bairro;
  }

  public String getResponsavel() {
    return responsavel;
  }

  public void setResponsavel(String responsavel) {
    this.responsavel = responsavel;
  }

  public String getProbabilidadeVoto() {
    return probabilidadeVoto;
  }

  public void setProbabilidadeVoto(String probabilidadeVoto) {
    this.probabilidadeVoto = probabilidadeVoto;
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

  public String getTermo() {
    return termo;
  }

  public void setTermo(String termo) {
    this.termo = termo;
  }

  public LocalDate getDataInicio() {
    return dataInicio;
  }

  public void setDataInicio(LocalDate dataInicio) {
    this.dataInicio = dataInicio;
  }

  public LocalDate getDataFim() {
    return dataFim;
  }

  public void setDataFim(LocalDate dataFim) {
    this.dataFim = dataFim;
  }
}
