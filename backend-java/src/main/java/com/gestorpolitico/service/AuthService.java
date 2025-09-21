package com.gestorpolitico.service;

import com.gestorpolitico.dto.LoginRequestDTO;
import com.gestorpolitico.entity.Login;
import com.gestorpolitico.repository.LoginRepository;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final LoginRepository loginRepository;

  public AuthService(LoginRepository loginRepository) {
    this.loginRepository = loginRepository;
  }

  public Login autenticar(LoginRequestDTO dto) {
    Optional<Login> login = loginRepository.findByUsuarioAndSenha(dto.getUsuario(), dto.getSenha());
    return login.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
  }
}
