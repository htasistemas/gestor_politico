package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Bairro;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BairroRepository extends JpaRepository<Bairro, Long> {
  List<Bairro> findByCidadeIdOrderByNomeAsc(Long cidadeId);

  List<Bairro> findByCidadeIdAndRegiaoIgnoreCaseOrderByNomeAsc(Long cidadeId, String regiao);

  Optional<Bairro> findByCidadeIdAndNomeNormalizado(Long cidadeId, String nomeNormalizado);
}
