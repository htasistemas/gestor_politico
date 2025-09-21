package com.gestorpolitico.web.dto;

public record LoginResponse(
  Long id,
  String usuario,
  String nome
) {}
