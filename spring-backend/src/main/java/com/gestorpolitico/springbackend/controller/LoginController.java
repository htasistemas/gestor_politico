package com.gestorpolitico.springbackend.controller;

import com.gestorpolitico.springbackend.dto.ErrorResponse;
import com.gestorpolitico.springbackend.dto.LoginRequest;
import com.gestorpolitico.springbackend.dto.LoginResponse;
import com.gestorpolitico.springbackend.service.LoginService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LoginController {
  private final LoginService loginService;

  public LoginController(LoginService loginService) {
    this.loginService = loginService;
  }

  @PostMapping("/login")
  public ResponseEntity<?> autenticar(@Valid @RequestBody LoginRequest request) {
    return loginService
      .autenticar(request.getUsuario(), request.getSenha())
      .<ResponseEntity<?>>map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
          new ErrorResponse(false, "Credenciais inválidas.", null)
        ));
  }
}
