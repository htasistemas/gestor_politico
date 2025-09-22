package com.gestorpolitico.entity;

import java.text.Normalizer;
import java.util.Locale;

final class NomeNormalizador {
  private NomeNormalizador() {}

  static String normalizar(String valor) {
    if (valor == null) {
      return "";
    }
    String semAcento = Normalizer.normalize(valor, Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return semAcento.toUpperCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
  }
}
