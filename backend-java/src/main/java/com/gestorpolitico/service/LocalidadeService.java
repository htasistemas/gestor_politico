package com.gestorpolitico.service;

import com.gestorpolitico.dto.AtualizarRegiaoBairrosRequestDTO;
import com.gestorpolitico.dto.BairroResponseDTO;
import com.gestorpolitico.dto.CidadeResponseDTO;
import com.gestorpolitico.dto.ImportacaoBairrosResponseDTO;
import com.gestorpolitico.dto.RegiaoRequestDTO;
import com.gestorpolitico.dto.RegiaoResponseDTO;
import com.gestorpolitico.entity.Bairro;
import com.gestorpolitico.entity.Cidade;
import com.gestorpolitico.entity.Regiao;
import com.gestorpolitico.repository.BairroRepository;
import com.gestorpolitico.repository.CidadeRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LocalidadeService {
  private final CidadeRepository cidadeRepository;
  private final BairroRepository bairroRepository;
  private final RegiaoRepository regiaoRepository;
  private final IbgeService ibgeService;

  public LocalidadeService(
    CidadeRepository cidadeRepository,
    BairroRepository bairroRepository,
    RegiaoRepository regiaoRepository,
    IbgeService ibgeService
  ) {
    this.cidadeRepository = cidadeRepository;
    this.bairroRepository = bairroRepository;
    this.regiaoRepository = regiaoRepository;
    this.ibgeService = ibgeService;
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
  public ImportacaoBairrosResponseDTO importarBairros(Long cidadeId) {
    Cidade cidade = cidadeRepository
      .findById(cidadeId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cidade não encontrada"));

    List<Bairro> existentes = bairroRepository.findByCidadeIdOrderByNomeAsc(cidadeId);
    Map<String, Bairro> indexPorNome = existentes
      .stream()
      .collect(Collectors.toMap(bairro -> normalizar(bairro.getNome()), bairro -> bairro));

    int inseridos = 0;
    int ignorados = 0;

    for (IbgeService.DistritoDTO distrito : ibgeService.buscarBairros(cidade)) {
      String nomeNormalizado = normalizar(distrito.nome());
      if (nomeNormalizado.isEmpty()) {
        continue;
      }
      if (indexPorNome.containsKey(nomeNormalizado)) {
        ignorados++;
        continue;
      }

      Bairro bairro = new Bairro();
      bairro.setCidade(cidade);
      bairro.setNome(formatarNome(distrito.nome()));
      bairroRepository.save(bairro);
      indexPorNome.put(nomeNormalizado, bairro);
      inseridos++;
    }

    return new ImportacaoBairrosResponseDTO(cidadeId, inseridos, ignorados);
  }

  private String normalizar(String valor) {
    if (valor == null) {
      return "";
    }
    String semAcento = java.text.Normalizer
      .normalize(valor, java.text.Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return semAcento
      .toUpperCase(Locale.ROOT)
      .replaceAll("[^A-Z0-9 ]", "")
      .replaceAll("\\s+", " ")
      .trim();
  }

  private String formatarNome(String valor) {
    if (valor == null) {
      return "";
    }
    String lower = valor.toLowerCase(Locale.ROOT);
    String[] partes = lower.split("\\s+");
    return java.util.Arrays
      .stream(partes)
      .map(parte -> parte.isBlank() ? parte : Character.toUpperCase(parte.charAt(0)) + parte.substring(1))
      .collect(Collectors.joining(" "));
  }
}
