package com.gestorpolitico.repository;

import com.gestorpolitico.domain.Login;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginRepository extends JpaRepository<Login, Long> {
  Optional<Login> findByUsuarioAndSenha(String usuario, String senha);

  Optional<Login> findByUsuario(String usuario);
}
