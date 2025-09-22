package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Regiao;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegiaoRepository extends JpaRepository<Regiao, Long> {
  List<Regiao> findByCidadeIdOrderByNomeAsc(Long cidadeId);

  Optional<Regiao> findByCidadeIdAndNomeIgnoreCase(Long cidadeId, String nome);
}
