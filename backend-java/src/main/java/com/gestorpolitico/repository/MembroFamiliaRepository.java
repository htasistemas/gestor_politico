package com.gestorpolitico.repository;

import com.gestorpolitico.entity.MembroFamilia;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembroFamiliaRepository extends JpaRepository<MembroFamilia, Long> {
  Optional<MembroFamilia> findByCpf(String cpf);
}
