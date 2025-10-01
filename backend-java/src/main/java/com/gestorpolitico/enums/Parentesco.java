package com.gestorpolitico.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;

public enum Parentesco {
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
  RESPONSAVEL("Responsável pela família"),
  OUTRO("Outro");

  private final String descricao;

  Parentesco(String descricao) {
    this.descricao = descricao;
  }

  @JsonCreator
  public static Parentesco fromValue(String valor) {
    if (valor == null) {
      return null;
    }

    String normalizado = normalizar(valor);
    return Arrays
      .stream(values())
      .filter(item -> normalizar(item.descricao).equals(normalizado) || normalizar(item.name()).equals(normalizado))
      .findFirst()
      .orElseThrow(() -> new IllegalArgumentException("Parentesco inválido: " + valor));
  }

  private static String normalizar(String valor) {
    return Normalizer
      .normalize(valor, Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
      .replaceAll("[^A-Za-z]", "")
      .toLowerCase(Locale.ROOT);
  }

  @JsonValue
  public String getCodigo() {
    return name();
  }
  public String getDescricao() {
    return descricao;
  }
}
