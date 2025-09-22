package com.gestorpolitico.service;

import com.gestorpolitico.dto.EnderecoResponseDTO;
import com.gestorpolitico.dto.PessoaRequestDTO;
import com.gestorpolitico.dto.PessoaResponseDTO;
import com.gestorpolitico.entity.Bairro;
import com.gestorpolitico.entity.Cidade;
import com.gestorpolitico.entity.Endereco;
import com.gestorpolitico.entity.Pessoa;
import com.gestorpolitico.entity.Regiao;
import com.gestorpolitico.repository.BairroRepository;
import com.gestorpolitico.repository.CidadeRepository;
import com.gestorpolitico.repository.PessoaRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import jakarta.transaction.Transactional;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PessoaService {
  private final PessoaRepository pessoaRepository;
  private final CidadeRepository cidadeRepository;
  private final BairroRepository bairroRepository;
  private final RegiaoRepository regiaoRepository;
  private final GeocodingService geocodingService;

  public PessoaService(
    PessoaRepository pessoaRepository,
    CidadeRepository cidadeRepository,
    BairroRepository bairroRepository,
    RegiaoRepository regiaoRepository,
    GeocodingService geocodingService
  ) {
    this.pessoaRepository = pessoaRepository;
    this.cidadeRepository = cidadeRepository;
    this.bairroRepository = bairroRepository;
    this.regiaoRepository = regiaoRepository;
    this.geocodingService = geocodingService;
  }

  @Transactional
  public PessoaResponseDTO criarPessoa(PessoaRequestDTO dto) {
    validarCpfDisponivel(dto.getCpf());
    Cidade cidade = cidadeRepository
      .findById(dto.getCidadeId())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cidade não encontrada"));

    Bairro bairro = resolverBairro(dto, cidade);
    Endereco endereco = construirEndereco(dto, cidade, bairro);

    Pessoa pessoa = new Pessoa();
    pessoa.setNome(dto.getNome());
    pessoa.setCpf(normalizarCpf(dto.getCpf()));
    pessoa.setEndereco(endereco);

    Pessoa salvo = pessoaRepository.save(pessoa);
    return mapearPessoa(salvo);
  }

  private void validarCpfDisponivel(String cpf) {
    String normalizado = normalizarCpf(cpf);
    if (pessoaRepository.findByCpf(normalizado).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
    }
  }

  private Bairro resolverBairro(PessoaRequestDTO dto, Cidade cidade) {
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
      return existente.get();
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

  private Endereco construirEndereco(PessoaRequestDTO dto, Cidade cidade, Bairro bairro) {
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
        endereco.setLatitude(coordenada.latitude());
        endereco.setLongitude(coordenada.longitude());
      });

    return endereco;
  }

  private String montarEnderecoCompleto(PessoaRequestDTO dto, Cidade cidade, Bairro bairro) {
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

  private PessoaResponseDTO mapearPessoa(Pessoa pessoa) {
    Endereco endereco = pessoa.getEndereco();
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
      endereco.getLatitude(),
      endereco.getLongitude()
    );

    return new PessoaResponseDTO(
      pessoa.getId(),
      pessoa.getNome(),
      pessoa.getCpf(),
      enderecoDTO
    );
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
