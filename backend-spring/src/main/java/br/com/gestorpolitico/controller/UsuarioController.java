package br.com.gestorpolitico.controller;

import br.com.gestorpolitico.dto.LoginRequestDto;
import br.com.gestorpolitico.dto.UsuarioAutenticadoDto;
import br.com.gestorpolitico.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
  private final UsuarioService usuarioService;

  public UsuarioController(UsuarioService usuarioService) {
    this.usuarioService = usuarioService;
  }

  @PostMapping("/login")
  public ResponseEntity<UsuarioAutenticadoDto> login(@Valid @RequestBody LoginRequestDto request) {
    UsuarioAutenticadoDto usuarioAutenticado =
      usuarioService.autenticar(request.usuario(), request.senha());
    return ResponseEntity.ok(usuarioAutenticado);
  }
}
