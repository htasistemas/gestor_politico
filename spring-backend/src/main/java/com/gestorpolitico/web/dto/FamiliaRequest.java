package com.gestorpolitico.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record FamiliaRequest(
  @NotBlank(message = "Informe o endereço")
  @Size(max = 255)
  String endereco,
  @NotBlank(message = "Informe o bairro")
  @Size(max = 120)
  String bairro,
  @NotBlank(message = "Informe o telefone")
  @Size(max = 30)
  String telefone,
  @NotEmpty(message = "Informe ao menos um membro")
  List<@Valid MembroFamiliaRequest> membros
) {}
