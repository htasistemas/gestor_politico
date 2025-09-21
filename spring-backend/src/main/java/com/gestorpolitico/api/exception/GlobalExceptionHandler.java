package com.gestorpolitico.api.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiErrorResponse> handleBusinessException(BusinessException ex) {
    ApiErrorResponse response = new ApiErrorResponse(ex.getCode(), ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
  }

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<Map<String, Object>> handleValidationException(ValidationException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("code", "VALIDATION_ERROR");
    body.put("message", ex.getMessage());
    body.put("errors", ex.getErrors());
    return ResponseEntity.badRequest().body(body);
  }

  @ResponseStatus(HttpStatus.BAD_REQUEST)
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public Map<String, Object> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("code", "VALIDATION_ERROR");
    body.put("message", "Erros de validação encontrados");
    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError error : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(error.getField(), error.getDefaultMessage());
    }
    body.put("errors", fieldErrors);
    body.put("timestamp", LocalDateTime.now());
    return body;
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiErrorResponse> handleRuntimeException(RuntimeException ex) {
    ApiErrorResponse response = new ApiErrorResponse("INTERNAL_ERROR", "Ocorreu um erro inesperado");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }
}
