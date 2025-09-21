package br.com.gestorpolitico.exception;

public class CredenciaisInvalidasException extends RuntimeException {
  public CredenciaisInvalidasException() {
    super("Credenciais inválidas");
  }
}
