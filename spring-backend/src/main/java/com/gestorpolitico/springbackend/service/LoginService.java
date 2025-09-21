package com.gestorpolitico.springbackend.service;

import com.gestorpolitico.springbackend.dto.LoginResponse;
import com.gestorpolitico.springbackend.dto.LoginResponse.UsuarioDto;
import com.gestorpolitico.springbackend.model.Usuario;
import com.gestorpolitico.springbackend.repository.LoginRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
  private final LoginRepository loginRepository;

  public LoginService(LoginRepository loginRepository) {
    this.loginRepository = loginRepository;
  }

  public Optional<LoginResponse> autenticar(String usuario, String senha) {
    return autenticarUsuario(usuario, senha).map(this::mapearParaResposta);
  }

  public Optional<Usuario> autenticarUsuario(String usuario, String senha) {
    return loginRepository.buscarPorCredenciais(usuario, senha);
  }

  private LoginResponse mapearParaResposta(Usuario usuario) {
    UsuarioDto dto = new UsuarioDto(usuario.getId(), usuario.getUsuario(), usuario.getNome());
    return new LoginResponse(true, null, dto);
  }
}
