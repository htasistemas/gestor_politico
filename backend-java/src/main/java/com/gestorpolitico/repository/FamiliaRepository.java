package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Familia;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamiliaRepository extends JpaRepository<Familia, Long> {
  @EntityGraph(attributePaths = "membros")
  List<Familia> findAllByOrderByCriadoEmDesc();
}
