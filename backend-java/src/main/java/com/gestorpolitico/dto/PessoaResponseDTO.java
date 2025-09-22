package com.gestorpolitico.dto;

public class PessoaResponseDTO {
  private Long id;
  private String nome;
  private String cpf;
  private EnderecoResponseDTO endereco;

  public PessoaResponseDTO() {}

  public PessoaResponseDTO(Long id, String nome, String cpf, EnderecoResponseDTO endereco) {
    this.id = id;
    this.nome = nome;
    this.cpf = cpf;
    this.endereco = endereco;
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

  public String getCpf() {
    return cpf;
  }

  public void setCpf(String cpf) {
    this.cpf = cpf;
  }

  public EnderecoResponseDTO getEndereco() {
    return endereco;
  }

  public void setEndereco(EnderecoResponseDTO endereco) {
    this.endereco = endereco;
  }
}
