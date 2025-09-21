package com.gestorpolitico.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MembroFamiliaResponse(
  Long id,
  String nomeCompleto,
  LocalDate dataNascimento,
  String profissao,
  String parentesco,
  boolean responsavelPrincipal,
  String probabilidadeVoto,
  String telefone,
  LocalDateTime criadoEm
) {}
