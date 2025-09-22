package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PessoaRequestDTO {
  @NotBlank
  @Size(max = 255)
  private String nome;

  @NotBlank
  @Pattern(regexp = "\\d{11}|\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}")
  private String cpf;

  @Size(max = 9)
  private String cep;

  @NotBlank
  @Size(max = 255)
  private String rua;

  @NotBlank
  @Size(max = 30)
  private String numero;

  @NotNull
  private Long cidadeId;

  private Long bairroId;

  @Size(max = 150)
  private String novoBairro;

  @Size(max = 120)
  private String novaRegiao;

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getCpf() {
    return cpf;
  }

  public void setCpf(String cpf) {
    this.cpf = cpf;
  }

  public String getCep() {
    return cep;
  }

  public void setCep(String cep) {
    this.cep = cep;
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

  public Long getCidadeId() {
    return cidadeId;
  }

  public void setCidadeId(Long cidadeId) {
    this.cidadeId = cidadeId;
  }

  public Long getBairroId() {
    return bairroId;
  }

  public void setBairroId(Long bairroId) {
    this.bairroId = bairroId;
  }

  public String getNovoBairro() {
    return novoBairro;
  }

  public void setNovoBairro(String novoBairro) {
    this.novoBairro = novoBairro;
  }

  public String getNovaRegiao() {
    return novaRegiao;
  }

  public void setNovaRegiao(String novaRegiao) {
    this.novaRegiao = novaRegiao;
  }
}
