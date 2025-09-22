package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Pessoa;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
  Optional<Pessoa> findByCpf(String cpf);
}
