package com.gestorpolitico.service;

import com.gestorpolitico.dto.AtualizarRegiaoBairrosRequestDTO;
import com.gestorpolitico.dto.BairroResponseDTO;
import com.gestorpolitico.dto.CidadeResponseDTO;
import com.gestorpolitico.dto.RegiaoRequestDTO;
import com.gestorpolitico.dto.RegiaoResponseDTO;
import com.gestorpolitico.entity.Bairro;
import com.gestorpolitico.entity.Cidade;
import com.gestorpolitico.entity.Endereco;
import com.gestorpolitico.entity.Familia;
import com.gestorpolitico.entity.Regiao;
import com.gestorpolitico.repository.BairroRepository;
import com.gestorpolitico.repository.CidadeRepository;
import com.gestorpolitico.repository.FamiliaRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LocalidadeService {
  private final CidadeRepository cidadeRepository;
  private final BairroRepository bairroRepository;
  private final RegiaoRepository regiaoRepository;
  private final FamiliaRepository familiaRepository;

  public LocalidadeService(
    CidadeRepository cidadeRepository,
    BairroRepository bairroRepository,
    RegiaoRepository regiaoRepository,
    FamiliaRepository familiaRepository
  ) {
    this.cidadeRepository = cidadeRepository;
    this.bairroRepository = bairroRepository;
    this.regiaoRepository = regiaoRepository;
    this.familiaRepository = familiaRepository;
  }

  public List<CidadeResponseDTO> listarCidades() {
    return cidadeRepository
      .findAll()
      .stream()
      .sorted(Comparator.comparing(Cidade::getNome, String.CASE_INSENSITIVE_ORDER))
      .map(cidade -> new CidadeResponseDTO(cidade.getId(), cidade.getNome(), cidade.getUf()))
      .toList();
  }

  public List<BairroResponseDTO> listarBairros(Long cidadeId, String regiao) {
    List<Bairro> bairros = regiao == null || regiao.isBlank()
      ? bairroRepository.findByCidadeIdOrderByNomeAsc(cidadeId)
      : bairroRepository.findByCidadeIdAndRegiaoIgnoreCaseOrderByNomeAsc(cidadeId, regiao.trim());

    return bairros
      .stream()
      .map(bairro -> new BairroResponseDTO(bairro.getId(), bairro.getNome(), bairro.getRegiao()))
      .toList();
  }

  public List<RegiaoResponseDTO> listarRegioes(Long cidadeId) {
    List<Bairro> bairros = bairroRepository.findByCidadeIdOrderByNomeAsc(cidadeId);
    Map<String, Long> contagemPorRegiao = bairros
      .stream()
      .filter(bairro -> bairro.getRegiao() != null && !bairro.getRegiao().isBlank())
      .collect(Collectors.groupingBy(bairro -> bairro.getRegiao().trim(), Collectors.counting()));

    List<RegiaoResponseDTO> regioes = regiaoRepository
      .findByCidadeIdOrderByNomeAsc(cidadeId)
      .stream()
      .map(regiao -> new RegiaoResponseDTO(
        regiao.getId(),
        regiao.getNome(),
        contagemPorRegiao.getOrDefault(regiao.getNome(), 0L)
      ))
      .collect(Collectors.toList());

    contagemPorRegiao
      .entrySet()
      .stream()
      .filter(entry -> regioes.stream().noneMatch(r -> r.getNome().equalsIgnoreCase(entry.getKey())))
      .map(entry -> new RegiaoResponseDTO(null, entry.getKey(), entry.getValue()))
      .forEach(regioes::add);

    regioes.sort(Comparator.comparing(RegiaoResponseDTO::getNome, String.CASE_INSENSITIVE_ORDER));
    return regioes;
  }

  @Transactional
  public RegiaoResponseDTO criarRegiao(Long cidadeId, RegiaoRequestDTO dto) {
    Cidade cidade = cidadeRepository
      .findById(cidadeId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cidade não encontrada"));

    regiaoRepository
      .findByCidadeIdAndNomeIgnoreCase(cidadeId, dto.getNome())
      .ifPresent(regiao -> {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Região já cadastrada para a cidade");
      });

    Regiao regiao = new Regiao();
    regiao.setCidade(cidade);
    regiao.setNome(dto.getNome().trim());
    Regiao salvo = regiaoRepository.save(regiao);
    return new RegiaoResponseDTO(salvo.getId(), salvo.getNome(), 0L);
  }

  @Transactional
  public void atribuirRegiao(Long regiaoId, List<Long> bairrosIds) {
    Regiao regiao = regiaoRepository
      .findById(regiaoId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Região não encontrada"));

    List<Bairro> bairros = bairroRepository.findAllById(bairrosIds);
    for (Bairro bairro : bairros) {
      if (!Objects.equals(bairro.getCidade().getId(), regiao.getCidade().getId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bairro não pertence à mesma cidade da região");
      }
      bairro.setRegiao(regiao.getNome());
    }
    bairroRepository.saveAll(bairros);
  }

  @Transactional
  public void atualizarRegiaoBairros(AtualizarRegiaoBairrosRequestDTO dto) {
    List<Bairro> bairros = bairroRepository.findAllById(dto.getBairrosIds());
    if (bairros.isEmpty()) {
      return;
    }

    Cidade cidade = bairros.get(0).getCidade();
    for (Bairro bairro : bairros) {
      if (!Objects.equals(bairro.getCidade().getId(), cidade.getId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos os bairros devem ser da mesma cidade");
      }
    }

    if (dto.getRegiaoId() != null) {
      Regiao regiao = regiaoRepository
        .findById(dto.getRegiaoId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Região não encontrada"));
      for (Bairro bairro : bairros) {
        bairro.setRegiao(regiao.getNome());
      }
    } else if (dto.getNomeRegiaoLivre() != null && !dto.getNomeRegiaoLivre().isBlank()) {
      String nomeRegiao = dto.getNomeRegiaoLivre().trim();
      regiaoRepository
        .findByCidadeIdAndNomeIgnoreCase(cidade.getId(), nomeRegiao)
        .orElseGet(() -> {
          Regiao nova = new Regiao();
          nova.setCidade(cidade);
          nova.setNome(nomeRegiao);
          return regiaoRepository.save(nova);
        });
      for (Bairro bairro : bairros) {
        bairro.setRegiao(nomeRegiao);
      }
    } else {
      for (Bairro bairro : bairros) {
        bairro.setRegiao(null);
      }
    }

    bairroRepository.saveAll(bairros);
  }

  @Transactional
  public void unificarBairros(Long bairroPrincipalId, List<Long> bairrosDuplicadosIds) {
    if (bairrosDuplicadosIds == null || bairrosDuplicadosIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione os bairros duplicados para unificação");
    }

    Bairro principal = bairroRepository
      .findById(bairroPrincipalId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bairro principal não encontrado"));

    List<Bairro> duplicados = bairroRepository.findAllById(bairrosDuplicadosIds);
    duplicados.removeIf(bairro -> Objects.equals(bairro.getId(), principal.getId()));

    if (duplicados.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos um bairro duplicado válido");
    }

    for (Bairro bairro : duplicados) {
      if (!Objects.equals(bairro.getCidade().getId(), principal.getCidade().getId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bairros de cidades diferentes não podem ser unificados");
      }
    }

    Set<Long> idsDuplicados = duplicados.stream().map(Bairro::getId).collect(Collectors.toSet());

    List<Familia> familias = familiaRepository.findByEnderecoDetalhadoBairroIdIn(idsDuplicados);
    for (Familia familia : familias) {
      Endereco endereco = familia.getEnderecoDetalhado();
      if (endereco != null && endereco.getBairro() != null && idsDuplicados.contains(endereco.getBairro().getId())) {
        endereco.setBairro(principal);
      }
      familia.setBairro(principal.getNome());
    }
    familiaRepository.saveAll(familias);

    bairroRepository.deleteAll(duplicados);
  }
}
