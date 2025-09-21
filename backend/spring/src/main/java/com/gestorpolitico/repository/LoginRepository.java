package com.gestorpolitico.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gestorpolitico.domain.Login;

public interface LoginRepository extends JpaRepository<Login, Long> {
  Optional<Login> findByUsuario(String usuario);

  Optional<Login> findByUsuarioAndSenha(String usuario, String senha);
}
