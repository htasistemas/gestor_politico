package com.gestorpolitico.repository;

import com.gestorpolitico.dto.DashboardTopParceiroResponseDTO;
import com.gestorpolitico.entity.Familia;
import com.gestorpolitico.entity.Parceiro;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface FamiliaRepository extends JpaRepository<Familia, Long>, JpaSpecificationExecutor<Familia> {
  @EntityGraph(attributePaths = "membros")
  List<Familia> findAllByOrderByCriadoEmDesc();

  List<Familia> findByEnderecoDetalhadoBairroIdIn(Collection<Long> bairrosIds);

  List<Familia> findByParceiroCadastro(Parceiro parceiro);

  @Query(
    "SELECT new com.gestorpolitico.dto.DashboardTopParceiroResponseDTO("
      + " p.id, COALESCE(m.nomeCompleto, ''), COUNT(f)) "
      + "FROM Familia f "
      + "JOIN f.parceiroCadastro p "
      + "LEFT JOIN p.membro m "
      + "GROUP BY p.id, m.nomeCompleto "
      + "ORDER BY COUNT(f) DESC"
  )
  List<DashboardTopParceiroResponseDTO> buscarTopParceiros(Pageable pageable);
}
