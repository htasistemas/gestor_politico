package com.gestorpolitico.controller;

import com.gestorpolitico.dto.LoginCreateRequestDTO;
import com.gestorpolitico.dto.LoginResponseDTO;
import com.gestorpolitico.dto.LoginUpdateRequestDTO;
import com.gestorpolitico.service.LoginService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class LoginController {
  private final LoginService loginService;

  public LoginController(LoginService loginService) {
    this.loginService = loginService;
  }

  @GetMapping
  public ResponseEntity<List<LoginResponseDTO>> listar() {
    return ResponseEntity.ok(loginService.listarTodos());
  }

  @GetMapping("/{id}")
  public ResponseEntity<LoginResponseDTO> buscarPorId(@PathVariable Long id) {
    return ResponseEntity.ok(loginService.buscarPorId(id));
  }

  @PostMapping
  public ResponseEntity<LoginResponseDTO> criar(@Valid @RequestBody LoginCreateRequestDTO dto) {
    LoginResponseDTO criado = loginService.criar(dto);
    return ResponseEntity.created(URI.create("/api/usuarios/" + criado.getId())).body(criado);
  }

  @PutMapping("/{id}")
  public ResponseEntity<LoginResponseDTO> atualizar(
    @PathVariable Long id,
    @Valid @RequestBody LoginUpdateRequestDTO dto
  ) {
    return ResponseEntity.ok(loginService.atualizar(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> remover(@PathVariable Long id) {
    loginService.remover(id);
    return ResponseEntity.noContent().build();
  }
}
