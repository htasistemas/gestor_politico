package com.gestorpolitico.springbackend.model;

public enum GrauParentesco {
  PAI,
  MAE,
  FILHOA,
  FILHA,
  FILHO,
  IRMAOA,
  PRIMOA,
  TIOA,
  SOBRINHOA,
  CONJUGE,
  AVOO,
  ENTEADOA,
  OUTRO;

  public String toDatabaseValue() {
    return switch (this) {
      case PAI -> "Pai";
      case MAE -> "Mãe";
      case FILHOA -> "Filho(a)";
      case FILHA -> "Filha";
      case FILHO -> "Filho";
      case IRMAOA -> "Irmão(ã)";
      case PRIMOA -> "Primo(a)";
      case TIOA -> "Tio(a)";
      case SOBRINHOA -> "Sobrinho(a)";
      case CONJUGE -> "Cônjuge";
      case AVOO -> "Avô(ó)";
      case ENTEADOA -> "Enteado(a)";
      case OUTRO -> "Outro";
    };
  }
}
