package com.gestorpolitico.controller;

import com.gestorpolitico.dto.LoginRequestDTO;
import com.gestorpolitico.dto.LoginResponseDTO;
import com.gestorpolitico.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
    LoginResponseDTO login = authService.autenticar(request);
    return ResponseEntity.ok(login);
  }
}
