package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Familia;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FamiliaRepository extends JpaRepository<Familia, Long>, JpaSpecificationExecutor<Familia> {
  @EntityGraph(attributePaths = "membros")
  List<Familia> findAllByOrderByCriadoEmDesc();

  List<Familia> findByEnderecoDetalhadoBairroIdIn(Collection<Long> bairrosIds);
}
