package com.gestorpolitico.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gestorpolitico.domain.Familia;

public interface FamiliaRepository extends JpaRepository<Familia, Long> {
  @Query("SELECT DISTINCT f FROM Familia f LEFT JOIN FETCH f.membros m ORDER BY f.criadoEm DESC")
  List<Familia> findAllWithMembros();

  @Query("SELECT f FROM Familia f LEFT JOIN FETCH f.membros m WHERE f.id = :id")
  Optional<Familia> findByIdWithMembros(@Param("id") Long id);
}
