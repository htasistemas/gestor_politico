package com.gestorpolitico.domain.converter;

import com.gestorpolitico.domain.GrauParentesco;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GrauParentescoConverter implements AttributeConverter<GrauParentesco, String> {
  @Override
  public String convertToDatabaseColumn(GrauParentesco atributo) {
    return atributo != null ? atributo.getValue() : null;
  }

  @Override
  public GrauParentesco convertToEntityAttribute(String coluna) {
    return coluna != null ? GrauParentesco.fromValue(coluna) : null;
  }
}
