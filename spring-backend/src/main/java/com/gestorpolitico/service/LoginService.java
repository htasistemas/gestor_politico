package com.gestorpolitico.service;

import com.gestorpolitico.repository.LoginRepository;
import com.gestorpolitico.web.dto.LoginRequest;
import com.gestorpolitico.web.dto.LoginResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LoginService {
  private final LoginRepository loginRepository;

  public LoginResponse autenticar(LoginRequest request) {
    return loginRepository.findByUsuarioAndSenha(request.usuario(), request.senha())
      .map(login -> new LoginResponse(login.getId(), login.getUsuario(), login.getNome()))
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
  }
}
