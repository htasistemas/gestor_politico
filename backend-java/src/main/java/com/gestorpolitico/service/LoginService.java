package com.gestorpolitico.service;

import com.gestorpolitico.dto.LoginCreateRequestDTO;
import com.gestorpolitico.dto.LoginResponseDTO;
import com.gestorpolitico.dto.LoginUpdateRequestDTO;
import com.gestorpolitico.entity.Login;
import com.gestorpolitico.repository.LoginRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoginService {
  private final LoginRepository loginRepository;

  public LoginService(LoginRepository loginRepository) {
    this.loginRepository = loginRepository;
  }

  @Transactional(readOnly = true)
  public List<LoginResponseDTO> listarTodos() {
    return loginRepository.findAll(Sort.by("nome")).stream()
      .map(login -> new LoginResponseDTO(login.getId(), login.getUsuario(), login.getNome(), login.getPerfil()))
      .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public LoginResponseDTO buscarPorId(Long id) {
    Login login = loginRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    return new LoginResponseDTO(login.getId(), login.getUsuario(), login.getNome(), login.getPerfil());
  }

  @Transactional
  public LoginResponseDTO criar(LoginCreateRequestDTO dto) {
    if (loginRepository.existsByUsuario(dto.getUsuario())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um usuário cadastrado com este e-mail.");
    }

    Login login = new Login();
    login.setUsuario(dto.getUsuario());
    login.setNome(dto.getNome());
    login.setSenha(dto.getSenha());
    login.setPerfil(dto.getPerfil());

    Login salvo = loginRepository.save(login);
    return new LoginResponseDTO(salvo.getId(), salvo.getUsuario(), salvo.getNome(), salvo.getPerfil());
  }

  @Transactional
  public LoginResponseDTO atualizar(Long id, LoginUpdateRequestDTO dto) {
    Login login = loginRepository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

    if (loginRepository.existsByUsuarioAndIdNot(dto.getUsuario(), id)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um usuário cadastrado com este e-mail.");
    }

    login.setUsuario(dto.getUsuario());
    login.setNome(dto.getNome());
    if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
      login.setSenha(dto.getSenha());
    }
    if (dto.getPerfil() != null) {
      login.setPerfil(dto.getPerfil());
    }

    Login salvo = loginRepository.save(login);
    return new LoginResponseDTO(salvo.getId(), salvo.getUsuario(), salvo.getNome(), salvo.getPerfil());
  }

  @Transactional
  public void remover(Long id) {
    if (!loginRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
    }
    loginRepository.deleteById(id);
  }
}
