package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Login;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginRepository extends JpaRepository<Login, Long> {
  Optional<Login> findByUsuarioAndSenha(String usuario, String senha);

  boolean existsByUsuario(String usuario);
}
