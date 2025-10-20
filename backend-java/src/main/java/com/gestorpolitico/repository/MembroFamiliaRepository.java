package com.gestorpolitico.repository;

import com.gestorpolitico.dto.DistribuicaoProbabilidadeResponseDTO;
import com.gestorpolitico.entity.MembroFamilia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MembroFamiliaRepository extends JpaRepository<MembroFamilia, Long> {
  @Query(
    "SELECT new com.gestorpolitico.dto.DistribuicaoProbabilidadeResponseDTO("
      + " mf.probabilidadeVoto, COUNT(mf)) "
      + "FROM MembroFamilia mf "
      + "GROUP BY mf.probabilidadeVoto"
  )
  List<DistribuicaoProbabilidadeResponseDTO> contarPorProbabilidade();

  @Query(
    "SELECT mf FROM MembroFamilia mf "
      + "JOIN FETCH mf.familia "
      + "WHERE mf.dataNascimento IS NOT NULL "
      + "AND FUNCTION('MONTH', mf.dataNascimento) = :mes"
  )
  List<MembroFamilia> buscarAniversariantesDoMes(@Param("mes") int mes);
}
