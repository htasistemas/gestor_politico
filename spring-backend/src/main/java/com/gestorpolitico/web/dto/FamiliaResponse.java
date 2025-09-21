package com.gestorpolitico.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FamiliaResponse(
  Long id,
  String endereco,
  String bairro,
  String telefone,
  LocalDateTime criadoEm,
  List<MembroFamiliaResponse> membros
) {}
