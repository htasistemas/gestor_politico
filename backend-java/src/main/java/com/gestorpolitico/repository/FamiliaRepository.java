package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Familia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamiliaRepository extends JpaRepository<Familia, Long> {
}
