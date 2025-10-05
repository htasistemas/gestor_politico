package com.gestorpolitico.service;

import com.gestorpolitico.dto.EnderecoResponseDTO;
import com.gestorpolitico.dto.FamiliaFiltroRequestDTO;
import com.gestorpolitico.dto.FamiliaListaResponseDTO;
import com.gestorpolitico.dto.FamiliaRequestDTO;
import com.gestorpolitico.dto.FamiliaResponseDTO;
import com.gestorpolitico.dto.MembroFamiliaRequestDTO;
import com.gestorpolitico.dto.MembroFamiliaResponseDTO;
import com.gestorpolitico.entity.Bairro;
import com.gestorpolitico.entity.Cidade;
import com.gestorpolitico.entity.Endereco;
import com.gestorpolitico.entity.Familia;
import com.gestorpolitico.entity.MembroFamilia;
import com.gestorpolitico.entity.Regiao;
import com.gestorpolitico.repository.BairroRepository;
import com.gestorpolitico.repository.CidadeRepository;
import com.gestorpolitico.repository.FamiliaRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import com.gestorpolitico.service.CepService.CepResultado;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FamiliaService {
  private static final Logger LOGGER = LoggerFactory.getLogger(FamiliaService.class);
  private final FamiliaRepository familiaRepository;
  private final CidadeRepository cidadeRepository;
  private final BairroRepository bairroRepository;
  private final RegiaoRepository regiaoRepository;
  private final GeocodingService geocodingService;
  private final CepService cepService;

  public FamiliaService(
    FamiliaRepository familiaRepository,
    CidadeRepository cidadeRepository,
    BairroRepository bairroRepository,
    RegiaoRepository regiaoRepository,
    GeocodingService geocodingService,
    CepService cepService
  ) {
    this.familiaRepository = familiaRepository;
    this.cidadeRepository = cidadeRepository;
    this.bairroRepository = bairroRepository;
    this.regiaoRepository = regiaoRepository;
    this.geocodingService = geocodingService;
    this.cepService = cepService;
  }

  @Transactional
  public FamiliaResponseDTO salvarFamilia(FamiliaRequestDTO dto) {
    if (dto.getMembros() == null || dto.getMembros().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos um membro da família.");
    }

    boolean possuiResponsavel = dto.getMembros().stream()
      .map(MembroFamiliaRequestDTO::getResponsavelPrincipal)
      .anyMatch(Boolean.TRUE::equals);

    if (!possuiResponsavel) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Defina um responsável principal para a família.");
    }

    Cidade cidade = cidadeRepository
      .findById(dto.getCidadeId())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cidade não encontrada"));

    String cepSanitizado = sanitizarCep(dto.getCep());
    if (cepSanitizado.length() != 8) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um CEP válido com 8 dígitos.");
    }

    CepResultado cepResultado = cepService
      .consultarCep(cepSanitizado)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CEP não encontrado"));

    validarCidadeComCep(cidade, cepResultado);

    Bairro bairro = resolverBairroFamilia(dto, cidade, cepResultado);
    Endereco endereco = construirEnderecoFamilia(dto, cidade, bairro, cepResultado, cepSanitizado);

    Familia familia = new Familia();
    familia.setEndereco(montarEnderecoResumo(dto));
    familia.setBairro(bairro.getNome());
    familia.setEnderecoDetalhado(endereco);

    List<MembroFamilia> membros = dto.getMembros().stream()
      .map(this::converterMembro)
      .collect(Collectors.toList());
    membros.forEach(familia::adicionarMembro);

    Familia salvo = familiaRepository.save(familia);
    return converterFamilia(salvo);
  }

  @Transactional(readOnly = true)
  public FamiliaListaResponseDTO buscarFamilias(FamiliaFiltroRequestDTO filtro, Pageable pageable) {
    Specification<Familia> specification = criarFiltroSpecification(filtro);
    Page<Familia> pagina = familiaRepository.findAll(specification, pageable);

    List<FamiliaResponseDTO> familias = pagina
      .getContent()
      .stream()
      .map(this::converterFamilia)
      .collect(Collectors.toList());

    List<Familia> familiasFiltradas = familiaRepository.findAll(specification);
    long responsaveisAtivos = familiasFiltradas
      .stream()
      .filter(familia ->
        familia
          .getMembros()
          .stream()
          .anyMatch(membro -> Boolean.TRUE.equals(membro.getResponsavelPrincipal()))
      )
      .count();

    OffsetDateTime seteDiasAtras = OffsetDateTime.now().minusDays(7);
    long novosCadastros = familiasFiltradas
      .stream()
      .filter(familia -> familia.getCriadoEm() != null && familia.getCriadoEm().isAfter(seteDiasAtras))
      .count();

    long totalPessoas = familiasFiltradas
      .stream()
      .mapToLong(familia -> familia.getMembros().size())
      .sum();

    long novasPessoasSemana = familiasFiltradas
      .stream()
      .flatMap(familia -> familia.getMembros().stream())
      .filter(membro -> membro.getCriadoEm() != null && membro.getCriadoEm().isAfter(seteDiasAtras))
      .count();

    return new FamiliaListaResponseDTO(
      familias,
      pagina.getTotalElements(),
      pagina.getNumber(),
      pagina.getSize(),
      responsaveisAtivos,
      novosCadastros,
      totalPessoas,
      novasPessoasSemana
    );
  }

  private MembroFamilia converterMembro(MembroFamiliaRequestDTO dto) {
    MembroFamilia membro = new MembroFamilia();
    membro.setNomeCompleto(dto.getNomeCompleto());
    membro.setDataNascimento(dto.getDataNascimento());
    membro.setProfissao(dto.getProfissao());
    membro.setParentesco(dto.getParentesco());
    membro.setResponsavelPrincipal(Boolean.TRUE.equals(dto.getResponsavelPrincipal()));
    membro.setProbabilidadeVoto(dto.getProbabilidadeVoto());
    membro.setTelefone(dto.getTelefone());
    return membro;
  }

  private Bairro resolverBairroFamilia(FamiliaRequestDTO dto, Cidade cidade, CepResultado cepResultado) {
    if (cepResultado.bairro() == null || cepResultado.bairro().isBlank()) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Não foi possível identificar o bairro através do CEP informado"
      );
    }

    Optional<Bairro> similar = encontrarBairroSimilar(cidade, cepResultado.bairro());
    if (similar.isPresent()) {
      Bairro bairroExistente = similar.get();
      aplicarRegiao(dto, cidade, bairroExistente);
      return bairroRepository.save(bairroExistente);
    }

    Bairro novoBairro = new Bairro();
    novoBairro.setCidade(cidade);
    novoBairro.setNome(formatarNomeBairro(cepResultado.bairro()));
    aplicarRegiao(dto, cidade, novoBairro);
    return bairroRepository.save(novoBairro);
  }

  private void aplicarRegiao(FamiliaRequestDTO dto, Cidade cidade, Bairro bairro) {
    if (dto.getNovaRegiao() == null || dto.getNovaRegiao().isBlank()) {
      return;
    }

    String regiaoNome = dto.getNovaRegiao().trim();
    garantirRegiao(cidade, regiaoNome);
    bairro.setRegiao(regiaoNome);
  }

  private void garantirRegiao(Cidade cidade, String regiaoNome) {
    regiaoRepository
      .findByCidadeIdAndNomeIgnoreCase(cidade.getId(), regiaoNome)
      .orElseGet(() -> {
        Regiao regiao = new Regiao();
        regiao.setCidade(cidade);
        regiao.setNome(regiaoNome.trim());
        return regiaoRepository.save(regiao);
      });
  }

  private Endereco construirEnderecoFamilia(
    FamiliaRequestDTO dto,
    Cidade cidade,
    Bairro bairro,
    CepResultado cepResultado,
    String cepSanitizado
  ) {
    Endereco endereco = new Endereco();
    endereco.setRua(dto.getRua());
    endereco.setNumero(dto.getNumero());
    endereco.setCep(cepSanitizado);
    endereco.setCidade(cidade);
    endereco.setBairro(bairro);

    String enderecoCompleto = montarEnderecoCompleto(dto, cidade, bairro, cepResultado, cepSanitizado);
    LOGGER.info("Preparando geocodificação do endereço da família: {}", enderecoCompleto);
    Optional<GeocodingService.Coordenada> coordenadaOptional = geocodingService.buscarCoordenadas(enderecoCompleto);

    if (coordenadaOptional.isEmpty()) {
      LOGGER.warn("Nenhuma coordenada retornada para o endereço: {}", enderecoCompleto);
      return endereco;
    }

    GeocodingService.Coordenada coordenada = coordenadaOptional.get();

    if (coordenada.latitude() != null) {
      endereco.setLatitude(BigDecimal.valueOf(coordenada.latitude()));
    }
    if (coordenada.longitude() != null) {
      endereco.setLongitude(BigDecimal.valueOf(coordenada.longitude()));
    }

    LOGGER.info(
      "Coordenadas definidas para o endereço da família (lat: {}, lon: {})",
      coordenada.latitude(),
      coordenada.longitude()
    );

    return endereco;
  }

  private Specification<Familia> criarFiltroSpecification(FamiliaFiltroRequestDTO filtro) {
    return (root, query, builder) -> {
      query.distinct(true);
      List<Predicate> predicates = new ArrayList<>();

      var enderecoJoin = root.join("enderecoDetalhado", JoinType.LEFT);
      var cidadeJoin = enderecoJoin.join("cidade", JoinType.LEFT);
      Join<Familia, MembroFamilia> membrosJoin = null;

      if (filtro == null) {
        return builder.conjunction();
      }

      if (filtro.getCidadeId() != null) {
        predicates.add(builder.equal(cidadeJoin.get("id"), filtro.getCidadeId()));
      }

      if (filtro.getRegiao() != null && !filtro.getRegiao().isBlank()) {
        var bairroJoin = enderecoJoin.join("bairro", JoinType.LEFT);
        predicates.add(
          builder.equal(
            builder.lower(bairroJoin.get("regiao")),
            filtro.getRegiao().trim().toLowerCase(Locale.ROOT)
          )
        );
      }

      if (filtro.getBairro() != null && !filtro.getBairro().isBlank()) {
        predicates.add(
          builder.like(
            builder.lower(root.get("bairro")),
            "%" + filtro.getBairro().trim().toLowerCase(Locale.ROOT) + "%"
          )
        );
      }

      if (filtro.getRua() != null && !filtro.getRua().isBlank()) {
        predicates.add(
          builder.like(
            builder.lower(enderecoJoin.get("rua")),
            "%" + filtro.getRua().trim().toLowerCase(Locale.ROOT) + "%"
          )
        );
      }

      if (filtro.getNumero() != null && !filtro.getNumero().isBlank()) {
        predicates.add(
          builder.like(
            builder.lower(enderecoJoin.get("numero")),
            "%" + filtro.getNumero().trim().toLowerCase(Locale.ROOT) + "%"
          )
        );
      }

      if (filtro.getCep() != null && !filtro.getCep().isBlank()) {
        String cepSanitizado = filtro.getCep().replaceAll("\\D", "");
        if (!cepSanitizado.isBlank()) {
          predicates.add(builder.like(enderecoJoin.get("cep"), "%" + cepSanitizado + "%"));
        }
      }

      if (filtro.getResponsavel() != null && !filtro.getResponsavel().isBlank()) {
        membrosJoin = root.join("membros", JoinType.LEFT);
        predicates.add(builder.isTrue(membrosJoin.get("responsavelPrincipal")));
        predicates.add(
          builder.like(
            builder.lower(membrosJoin.get("nomeCompleto")),
            "%" + filtro.getResponsavel().trim().toLowerCase(Locale.ROOT) + "%"
          )
        );
      }

      if (filtro.getProbabilidadeVoto() != null && !filtro.getProbabilidadeVoto().isBlank()) {
        if (membrosJoin == null) {
          membrosJoin = root.join("membros", JoinType.LEFT);
        }
        predicates.add(
          builder.equal(
            builder.lower(membrosJoin.get("probabilidadeVoto")),
            filtro.getProbabilidadeVoto().trim().toLowerCase(Locale.ROOT)
          )
        );
      }

      if (filtro.getDataInicio() != null) {
        OffsetDateTime inicio = filtro
          .getDataInicio()
          .atStartOfDay(ZoneId.systemDefault())
          .toOffsetDateTime();
        predicates.add(builder.greaterThanOrEqualTo(root.get("criadoEm"), inicio));
      }

      if (filtro.getDataFim() != null) {
        OffsetDateTime fim = filtro
          .getDataFim()
          .atTime(LocalTime.MAX)
          .atZone(ZoneId.systemDefault())
          .toOffsetDateTime();
        predicates.add(builder.lessThanOrEqualTo(root.get("criadoEm"), fim));
      }

      if (filtro.getTermo() != null && !filtro.getTermo().isBlank()) {
        String termoLike = "%" + filtro.getTermo().trim().toLowerCase(Locale.ROOT) + "%";
        Predicate enderecoPredicate = builder.like(builder.lower(root.get("endereco")), termoLike);
        Predicate bairroPredicate = builder.like(builder.lower(root.get("bairro")), termoLike);
        Predicate cidadePredicate = builder.like(builder.lower(cidadeJoin.get("nome")), termoLike);
        if (membrosJoin == null) {
          membrosJoin = root.join("membros", JoinType.LEFT);
        }
        Predicate responsavelPredicate = builder.like(builder.lower(membrosJoin.get("nomeCompleto")), termoLike);
        predicates.add(builder.or(enderecoPredicate, bairroPredicate, cidadePredicate, responsavelPredicate));
      }

      if (predicates.isEmpty()) {
        return builder.conjunction();
      }

      return builder.and(predicates.toArray(new Predicate[0]));
    };
  }

  private String montarEnderecoCompleto(
    FamiliaRequestDTO dto,
    Cidade cidade,
    Bairro bairro,
    CepResultado cepResultado,
    String cepSanitizado
  ) {
    StringBuilder builder = new StringBuilder();
    adicionarParte(builder, obterPrimeiroValorNaoVazio(dto.getRua(), cepResultado.logradouro()));
    adicionarParte(builder, obterPrimeiroValorNaoVazio(dto.getNumero()));
    if (bairro != null) {
      adicionarParte(builder, bairro.getNome());
    }
    adicionarParte(builder, cidade.getNome() + " - " + cidade.getUf());
    if (cepSanitizado != null && !cepSanitizado.isBlank()) {
      adicionarParte(builder, "CEP " + cepSanitizado);
    }
    adicionarParte(builder, "Brasil");
    return builder.toString();
  }

  private void adicionarParte(StringBuilder builder, String valor) {
    if (valor == null) {
      return;
    }
    String normalizado = valor.trim();
    if (normalizado.isEmpty()) {
      return;
    }
    if (builder.length() > 0) {
      builder.append(", ");
    }
    builder.append(normalizado);
  }

  private String obterPrimeiroValorNaoVazio(String... valores) {
    if (valores == null) {
      return null;
    }
    for (String valor : valores) {
      if (valor == null) {
        continue;
      }
      String normalizado = valor.trim();
      if (!normalizado.isEmpty()) {
        return normalizado;
      }
    }
    return null;
  }

  private void validarCidadeComCep(Cidade cidade, CepResultado cepResultado) {
    if (cepResultado.cidade() == null || cepResultado.uf() == null) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "O CEP informado não retornou cidade ou estado válidos"
      );
    }

    String cidadeCepNormalizada = normalizarTexto(cepResultado.cidade());
    String cidadeSelecionadaNormalizada = normalizarTexto(cidade.getNome());
    boolean mesmaCidade = cidadeSelecionadaNormalizada.equals(cidadeCepNormalizada);
    boolean mesmaUf = cidade.getUf().equalsIgnoreCase(cepResultado.uf());

    if (!mesmaCidade || !mesmaUf) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "CEP informado não pertence à cidade selecionada"
      );
    }
  }

  private Optional<Bairro> encontrarBairroSimilar(Cidade cidade, String nomeBairro) {
    String nomeNormalizado = normalizarTexto(nomeBairro);
    List<Bairro> bairros = bairroRepository.findByCidadeIdOrderByNomeAsc(cidade.getId());

    Bairro melhorCandidato = null;
    double maiorSimilaridade = 0.0;

    for (Bairro candidato : bairros) {
      String candidatoNormalizado = candidato.getNomeNormalizado() != null
        ? candidato.getNomeNormalizado()
        : normalizarTexto(candidato.getNome());
      double similaridade = calcularSimilaridade(nomeNormalizado, candidatoNormalizado);
      if (similaridade > maiorSimilaridade) {
        maiorSimilaridade = similaridade;
        melhorCandidato = candidato;
      }
      if (similaridade == 1.0) {
        break;
      }
    }

    if (maiorSimilaridade >= 0.9 && melhorCandidato != null) {
      return Optional.of(melhorCandidato);
    }
    return Optional.empty();
  }

  private double calcularSimilaridade(String primeiro, String segundo) {
    if (primeiro == null || segundo == null) {
      return 0.0;
    }
    if (primeiro.equals(segundo)) {
      return 1.0;
    }
    int maiorTamanho = Math.max(primeiro.length(), segundo.length());
    if (maiorTamanho == 0) {
      return 0.0;
    }
    int distancia = calcularDistanciaLevenshtein(primeiro, segundo);
    return (maiorTamanho - distancia) / (double) maiorTamanho;
  }

  private int calcularDistanciaLevenshtein(String primeiro, String segundo) {
    int[][] matriz = new int[primeiro.length() + 1][segundo.length() + 1];
    for (int i = 0; i <= primeiro.length(); i++) {
      matriz[i][0] = i;
    }
    for (int j = 0; j <= segundo.length(); j++) {
      matriz[0][j] = j;
    }
    for (int i = 1; i <= primeiro.length(); i++) {
      for (int j = 1; j <= segundo.length(); j++) {
        int custo = primeiro.charAt(i - 1) == segundo.charAt(j - 1) ? 0 : 1;
        matriz[i][j] = Math.min(
          Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1),
          matriz[i - 1][j - 1] + custo
        );
      }
    }
    return matriz[primeiro.length()][segundo.length()];
  }

  private String formatarNomeBairro(String valor) {
    if (valor == null) {
      return "";
    }
    String[] partes = valor.toLowerCase(Locale.ROOT).split("\\s+");
    return Arrays
      .stream(partes)
      .filter(parte -> !parte.isBlank())
      .map(parte -> Character.toUpperCase(parte.charAt(0)) + parte.substring(1))
      .collect(Collectors.joining(" "));
  }

  private String sanitizarCep(String cep) {
    if (cep == null) {
      return "";
    }
    return cep.replaceAll("\\D", "");
  }

  private FamiliaResponseDTO converterFamilia(Familia familia) {
    Endereco endereco = familia.getEnderecoDetalhado();
    Bairro bairro = endereco.getBairro();
    Cidade cidade = endereco.getCidade();
    EnderecoResponseDTO enderecoDTO = new EnderecoResponseDTO(
      endereco.getId(),
      endereco.getRua(),
      endereco.getNumero(),
      endereco.getCep(),
      bairro != null ? bairro.getNome() : null,
      bairro != null ? bairro.getRegiao() : null,
      cidade.getNome(),
      cidade.getUf(),
      endereco.getLatitude() != null ? endereco.getLatitude().doubleValue() : null,
      endereco.getLongitude() != null ? endereco.getLongitude().doubleValue() : null
    );

    List<MembroFamiliaResponseDTO> membros = familia.getMembros().stream()
      .map(membro -> new MembroFamiliaResponseDTO(
        membro.getId(),
        membro.getNomeCompleto(),
        membro.getDataNascimento(),
        membro.getProfissao(),
        membro.getParentesco(),
        Boolean.TRUE.equals(membro.getResponsavelPrincipal()),
        membro.getProbabilidadeVoto(),
        membro.getTelefone(),
        membro.getCriadoEm()
      ))
      .collect(Collectors.toList());

    return new FamiliaResponseDTO(
      familia.getId(),
      familia.getEndereco(),
      familia.getBairro(),
      familia.getCriadoEm(),
      enderecoDTO,
      membros
    );
  }

  private String montarEnderecoResumo(FamiliaRequestDTO dto) {
    return dto.getRua().trim() + ", " + dto.getNumero().trim();
  }

  private String normalizarTexto(String valor) {
    if (valor == null) {
      return "";
    }
    String semAcento = Normalizer
      .normalize(valor, Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return semAcento.toUpperCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
  }
}
