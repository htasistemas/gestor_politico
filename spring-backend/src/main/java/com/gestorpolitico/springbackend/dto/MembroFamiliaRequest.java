package com.gestorpolitico.springbackend.dto;

import com.gestorpolitico.springbackend.model.GrauParentesco;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class MembroFamiliaRequest {
  @NotBlank(message = "O nome completo é obrigatório.")
  @Size(max = 255, message = "O nome completo deve ter no máximo 255 caracteres.")
  private String nomeCompleto;

  @Pattern(
    regexp = "^\\d{4}-\\d{2}-\\d{2}$",
    message = "A data de nascimento deve estar no formato ISO (yyyy-MM-dd).",
    groups = ValidacaoOpcional.class
  )
  private String dataNascimento;

  @Size(max = 255, message = "A profissão deve ter no máximo 255 caracteres.")
  private String profissao;

  @NotNull(message = "O parentesco é obrigatório.")
  private GrauParentesco parentesco;

  @NotNull(message = "Informe se o membro é responsável principal.")
  private Boolean responsavelPrincipal;

  @NotBlank(message = "A probabilidade de voto é obrigatória.")
  @Size(max = 20, message = "A probabilidade de voto deve ter no máximo 20 caracteres.")
  private String probabilidadeVoto;

  @Size(max = 30, message = "O telefone deve ter no máximo 30 caracteres.")
  private String telefone;

  public String getNomeCompleto() {
    return nomeCompleto;
  }

  public void setNomeCompleto(String nomeCompleto) {
    this.nomeCompleto = nomeCompleto;
  }

  public String getDataNascimento() {
    return dataNascimento;
  }

  public void setDataNascimento(String dataNascimento) {
    this.dataNascimento = dataNascimento;
  }

  public String getProfissao() {
    return profissao;
  }

  public void setProfissao(String profissao) {
    this.profissao = profissao;
  }

  public GrauParentesco getParentesco() {
    return parentesco;
  }

  public void setParentesco(GrauParentesco parentesco) {
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

  public interface ValidacaoOpcional {
  }
}
