package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Parceiro;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParceiroRepository extends JpaRepository<Parceiro, Long> {
  Optional<Parceiro> findByToken(String token);

  Optional<Parceiro> findByMembroId(Long membroId);

  boolean existsByToken(String token);
}
