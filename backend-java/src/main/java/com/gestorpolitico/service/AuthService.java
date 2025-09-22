package com.gestorpolitico.service;

import com.gestorpolitico.dto.LoginRequestDTO;
import com.gestorpolitico.dto.LoginResponseDTO;
import com.gestorpolitico.entity.Login;
import com.gestorpolitico.repository.LoginRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final LoginRepository loginRepository;

  public AuthService(LoginRepository loginRepository) {
    this.loginRepository = loginRepository;
  }

  @Transactional(readOnly = true)
  public LoginResponseDTO autenticar(LoginRequestDTO dto) {
    Login login = loginRepository.findByUsuarioAndSenha(dto.getUsuario(), dto.getSenha())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));

    return new LoginResponseDTO(login.getId(), login.getUsuario(), login.getNome(), login.getPerfil());
  }
}
