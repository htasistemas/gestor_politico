package com.gestorpolitico.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gestorpolitico.domain.MembroFamilia;

public interface MembroFamiliaRepository extends JpaRepository<MembroFamilia, Long> {
  List<MembroFamilia> findByFamiliaId(Long familiaId);

  boolean existsByFamiliaIdAndResponsavelPrincipalTrue(Long familiaId);

  Optional<MembroFamilia> findByFamiliaIdAndResponsavelPrincipalTrue(Long familiaId);
}
