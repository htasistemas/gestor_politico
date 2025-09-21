package com.gestorpolitico.springbackend.validation;

import com.gestorpolitico.springbackend.dto.ErrorResponse;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidacao(MethodArgumentNotValidException ex) {
    List<String> erros = ex
      .getBindingResult()
      .getFieldErrors()
      .stream()
      .map(this::formatarErro)
      .toList();
    ErrorResponse body = new ErrorResponse(false, "Dados inválidos.", erros);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
    List<String> erros = ex
      .getConstraintViolations()
      .stream()
      .map(violation -> violation.getMessage())
      .collect(Collectors.toList());
    ErrorResponse body = new ErrorResponse(false, "Dados inválidos.", erros);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
    ErrorResponse body = new ErrorResponse(false, ex.getMessage(), List.of());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGenerico(Exception ex) {
    ErrorResponse body = new ErrorResponse(false, "Erro no servidor.", List.of(ex.getMessage()));
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }

  private String formatarErro(FieldError fieldError) {
    return "%s: %s".formatted(fieldError.getField(), fieldError.getDefaultMessage());
  }
}
