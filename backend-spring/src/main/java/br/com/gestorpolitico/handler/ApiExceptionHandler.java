package br.com.gestorpolitico.handler;

import br.com.gestorpolitico.exception.CredenciaisInvalidasException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(CredenciaisInvalidasException.class)
  public ResponseEntity<Map<String, Object>> handleCredenciaisInvalidas(
    CredenciaisInvalidasException ex
  ) {
    return ResponseEntity
      .status(HttpStatus.UNAUTHORIZED)
      .body(Map.of("success", false, "message", ex.getMessage()));
  }
}
