package br.com.gestorpolitico.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDto(
  @NotBlank(message = "O usuário é obrigatório") String usuario,
  @NotBlank(message = "A senha é obrigatória") String senha
) {}
