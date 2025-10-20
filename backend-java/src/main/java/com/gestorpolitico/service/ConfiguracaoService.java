package com.gestorpolitico.service;

import com.gestorpolitico.entity.Configuracao;
import com.gestorpolitico.repository.ConfiguracaoRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoService {
  private static final String META_TOTAL_PESSOAS_CHAVE = "dashboard.meta.total_pessoas";

  private final ConfiguracaoRepository configuracaoRepository;

  public ConfiguracaoService(ConfiguracaoRepository configuracaoRepository) {
    this.configuracaoRepository = configuracaoRepository;
  }

  @Transactional(readOnly = true)
  public Optional<Long> obterMetaTotalPessoas() {
    return configuracaoRepository
      .findByChave(META_TOTAL_PESSOAS_CHAVE)
      .flatMap(configuracao -> converterValorParaLong(configuracao.getValor()));
  }

  @Transactional
  public Long salvarMetaTotalPessoas(Long meta) {
    Configuracao configuracao = configuracaoRepository
      .findByChave(META_TOTAL_PESSOAS_CHAVE)
      .orElseGet(() -> {
        Configuracao novo = new Configuracao();
        novo.setChave(META_TOTAL_PESSOAS_CHAVE);
        return novo;
      });

    configuracao.setValor(meta.toString());
    configuracaoRepository.save(configuracao);
    return meta;
  }

  private Optional<Long> converterValorParaLong(String valor) {
    try {
      return Optional.ofNullable(valor).map(Long::valueOf);
    } catch (NumberFormatException ex) {
      return Optional.empty();
    }
  }
}
