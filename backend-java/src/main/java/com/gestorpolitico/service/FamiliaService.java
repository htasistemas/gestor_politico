package com.gestorpolitico.service;

import com.gestorpolitico.dto.EnderecoResponseDTO;
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
import com.gestorpolitico.repository.MembroFamiliaRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FamiliaService {
  private final FamiliaRepository familiaRepository;
  private final CidadeRepository cidadeRepository;
  private final BairroRepository bairroRepository;
  private final RegiaoRepository regiaoRepository;
  private final MembroFamiliaRepository membroFamiliaRepository;
  private final GeocodingService geocodingService;

  public FamiliaService(
    FamiliaRepository familiaRepository,
    CidadeRepository cidadeRepository,
    BairroRepository bairroRepository,
    RegiaoRepository regiaoRepository,
    MembroFamiliaRepository membroFamiliaRepository,
    GeocodingService geocodingService
  ) {
    this.familiaRepository = familiaRepository;
    this.cidadeRepository = cidadeRepository;
    this.bairroRepository = bairroRepository;
    this.regiaoRepository = regiaoRepository;
    this.membroFamiliaRepository = membroFamiliaRepository;
    this.geocodingService = geocodingService;
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

    Bairro bairro = resolverBairroFamilia(dto, cidade);
    if (bairro == null && (dto.getNovoBairro() == null || dto.getNovoBairro().isBlank())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o bairro da família.");
    }

    Endereco endereco = construirEnderecoFamilia(dto, cidade, bairro);

    Familia familia = new Familia();
    familia.setEndereco(montarEnderecoResumo(dto));
    familia.setBairro(bairro != null ? bairro.getNome() : dto.getNovoBairro().trim());
    familia.setTelefone(dto.getTelefone());
    familia.setEnderecoDetalhado(endereco);

    Set<String> cpfsInformados = new HashSet<>();
    List<MembroFamilia> membros = dto.getMembros().stream()
      .map(membro -> converterMembro(membro, cpfsInformados))
      .collect(Collectors.toList());
    membros.forEach(familia::adicionarMembro);

    Familia salvo = familiaRepository.save(familia);
    return converterFamilia(salvo);
  }

  @Transactional(readOnly = true)
  public List<FamiliaResponseDTO> listarFamilias() {
    return familiaRepository.findAllByOrderByCriadoEmDesc().stream()
      .map(this::converterFamilia)
      .collect(Collectors.toList());
  }

  private MembroFamilia converterMembro(MembroFamiliaRequestDTO dto, Set<String> cpfsInformados) {
    String cpfNormalizado = normalizarCpf(dto.getCpf());

    if (!cpfsInformados.add(cpfNormalizado)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF duplicado entre os membros informados.");
    }

    membroFamiliaRepository
      .findByCpf(cpfNormalizado)
      .ifPresent(existente -> {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado em outra família.");
      });

    MembroFamilia membro = new MembroFamilia();
    membro.setNomeCompleto(dto.getNomeCompleto());
    membro.setCpf(cpfNormalizado);
    membro.setDataNascimento(dto.getDataNascimento());
    membro.setProfissao(dto.getProfissao());
    membro.setParentesco(dto.getParentesco());
    membro.setResponsavelPrincipal(Boolean.TRUE.equals(dto.getResponsavelPrincipal()));
    membro.setProbabilidadeVoto(dto.getProbabilidadeVoto());
    membro.setTelefone(dto.getTelefone());
    return membro;
  }

  private Bairro resolverBairroFamilia(FamiliaRequestDTO dto, Cidade cidade) {
    if (dto.getBairroId() != null) {
      Bairro bairro = bairroRepository
        .findById(dto.getBairroId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bairro não encontrado"));
      if (!bairro.getCidade().getId().equals(cidade.getId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bairro não pertence à cidade informada");
      }
      if (dto.getNovaRegiao() != null && !dto.getNovaRegiao().isBlank()) {
        String regiaoNome = dto.getNovaRegiao().trim();
        garantirRegiao(cidade, regiaoNome);
        bairro.setRegiao(regiaoNome);
        bairroRepository.save(bairro);
      }
      return bairro;
    }

    if (dto.getNovoBairro() == null || dto.getNovoBairro().isBlank()) {
      return null;
    }

    String nomeBairro = dto.getNovoBairro().trim();
    String normalizado = normalizarTexto(nomeBairro);
    Optional<Bairro> existente = bairroRepository.findByCidadeIdAndNomeNormalizado(cidade.getId(), normalizado);
    if (existente.isPresent()) {
      Bairro bairroExistente = existente.get();
      if (dto.getNovaRegiao() != null && !dto.getNovaRegiao().isBlank()) {
        String regiaoNome = dto.getNovaRegiao().trim();
        garantirRegiao(cidade, regiaoNome);
        bairroExistente.setRegiao(regiaoNome);
        bairroRepository.save(bairroExistente);
      }
      return bairroExistente;
    }

    Bairro bairro = new Bairro();
    bairro.setCidade(cidade);
    bairro.setNome(nomeBairro);
    if (dto.getNovaRegiao() != null && !dto.getNovaRegiao().isBlank()) {
      String regiaoNome = dto.getNovaRegiao().trim();
      garantirRegiao(cidade, regiaoNome);
      bairro.setRegiao(regiaoNome);
    }
    return bairroRepository.save(bairro);
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

  private Endereco construirEnderecoFamilia(FamiliaRequestDTO dto, Cidade cidade, Bairro bairro) {
    Endereco endereco = new Endereco();
    endereco.setRua(dto.getRua());
    endereco.setNumero(dto.getNumero());
    endereco.setCep(dto.getCep());
    endereco.setCidade(cidade);
    endereco.setBairro(bairro);

    String enderecoCompleto = montarEnderecoCompleto(dto, cidade, bairro);
      geocodingService
              .buscarCoordenadas(enderecoCompleto)
              .ifPresent(coordenada -> {
                  endereco.setLatitude(
                          coordenada.latitude() != null ? BigDecimal.valueOf(coordenada.latitude()) : null
                  );
                  endereco.setLongitude(
                          coordenada.longitude() != null ? BigDecimal.valueOf(coordenada.longitude()) : null
                  );
              });

    return endereco;
  }

  private String montarEnderecoCompleto(FamiliaRequestDTO dto, Cidade cidade, Bairro bairro) {
    StringBuilder builder = new StringBuilder();
    builder.append(dto.getRua()).append(", ").append(dto.getNumero());
    if (bairro != null) {
      builder.append(", ").append(bairro.getNome());
    }
    builder.append(", ").append(cidade.getNome()).append(" - ").append(cidade.getUf());
    if (dto.getCep() != null && !dto.getCep().isBlank()) {
      builder.append(", CEP ").append(dto.getCep());
    }
    builder.append(", Brasil");
    return builder.toString();
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
        membro.getCpf(),
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
      familia.getTelefone(),
      familia.getCriadoEm(),
      enderecoDTO,
      membros
    );
  }

  private String montarEnderecoResumo(FamiliaRequestDTO dto) {
    return dto.getRua().trim() + ", " + dto.getNumero().trim();
  }

  private String normalizarCpf(String cpf) {
    return cpf.replaceAll("\\D", "");
  }

  private String normalizarTexto(String valor) {
    String semAcento = Normalizer
      .normalize(valor, Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return semAcento.toUpperCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
  }
}
