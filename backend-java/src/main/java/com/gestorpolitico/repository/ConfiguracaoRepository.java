package com.gestorpolitico.repository;

import com.gestorpolitico.entity.Configuracao;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracaoRepository extends JpaRepository<Configuracao, Long> {
  Optional<Configuracao> findByChave(String chave);
}
