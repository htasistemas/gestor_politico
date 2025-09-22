package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Cidade;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CidadeRepository extends JpaRepository<Cidade, Long> {
  Optional<Cidade> findByNomeIgnoreCaseAndUfIgnoreCase(String nome, String uf);
}
