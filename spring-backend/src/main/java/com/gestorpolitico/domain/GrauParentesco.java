package com.gestorpolitico.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum GrauParentesco {
  PAI("Pai"),
  MAE("Mãe"),
  FILHO_A("Filho(a)"),
  FILHA("Filha"),
  FILHO("Filho"),
  IRMAO_A("Irmão(ã)"),
  PRIMO_A("Primo(a)"),
  TIO_A("Tio(a)"),
  SOBRINHO_A("Sobrinho(a)"),
  CONJUGE("Cônjuge"),
  AVO_O("Avô(ó)"),
  ENTEADO_A("Enteado(a)"),
  OUTRO("Outro");

  private final String value;

  GrauParentesco(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  @Override
  public String toString() {
    return value;
  }

  @JsonCreator
  public static GrauParentesco fromValue(String value) {
    return Arrays.stream(values())
      .filter(item -> item.value.equalsIgnoreCase(value))
      .findFirst()
      .orElseThrow(() -> new IllegalArgumentException("Parentesco inválido: " + value));
  }
}
