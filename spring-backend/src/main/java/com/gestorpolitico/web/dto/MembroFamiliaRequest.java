package com.gestorpolitico.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record MembroFamiliaRequest(
  @NotBlank(message = "Informe o nome completo")
  @Size(max = 255)
  String nomeCompleto,
  LocalDate dataNascimento,
  @Size(max = 255)
  String profissao,
  @NotBlank(message = "Informe o grau de parentesco")
  String parentesco,
  @NotNull(message = "Informe se é o responsável principal")
  Boolean responsavelPrincipal,
  @NotBlank(message = "Informe a probabilidade de voto")
  @Size(max = 20)
  String probabilidadeVoto,
  @Size(max = 30)
  String telefone
) {}
