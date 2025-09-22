package com.gestorpolitico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class MembroFamiliaRequestDTO {
  @NotBlank(message = "O nome completo é obrigatório.")
  @Size(max = 255, message = "O nome completo deve ter no máximo 255 caracteres.")
  private String nomeCompleto;

  @NotBlank(message = "O CPF é obrigatório.")
  @Pattern(regexp = "\\d{11}|\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "Informe um CPF válido.")
  private String cpf;

  @Past(message = "A data de nascimento deve estar no passado.")
  private LocalDate dataNascimento;

  @Size(max = 255, message = "A profissão deve ter no máximo 255 caracteres.")
  private String profissao;

  @NotBlank(message = "O parentesco é obrigatório.")
  private String parentesco;

  @NotNull(message = "Informe se é responsável principal.")
  private Boolean responsavelPrincipal;

  @NotBlank(message = "Informe a probabilidade de voto.")
  private String probabilidadeVoto;

  @Size(max = 30, message = "O telefone deve ter no máximo 30 caracteres.")
  private String telefone;

  @Size(max = 9, message = "O CEP deve ter no máximo 9 caracteres.")
  private String cep;

  @NotBlank(message = "Informe a rua do membro.")
  @Size(max = 255, message = "A rua deve ter no máximo 255 caracteres.")
  private String rua;

  @NotBlank(message = "Informe o número do endereço.")
  @Size(max = 30, message = "O número deve ter no máximo 30 caracteres.")
  private String numero;

  @NotNull(message = "Selecione a cidade do membro.")
  private Long cidadeId;

  private Long bairroId;

  @Size(max = 150, message = "O bairro deve ter no máximo 150 caracteres.")
  private String novoBairro;

  @Size(max = 120, message = "A região deve ter no máximo 120 caracteres.")
  private String novaRegiao;

  public MembroFamiliaRequestDTO() {
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
