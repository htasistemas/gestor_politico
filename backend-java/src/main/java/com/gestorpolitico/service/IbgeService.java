package com.gestorpolitico.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.gestorpolitico.entity.Cidade;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

@Service
public class IbgeService {
  private static final Logger LOGGER = LoggerFactory.getLogger(IbgeService.class);
  private static final String MUNICIPIOS_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";

  private final WebClient webClient;

  public IbgeService(WebClient webClient) {
    this.webClient = webClient;
  }

  public List<DistritoDTO> buscarBairros(Cidade cidade) {
    Optional<MunicipioDTO> municipio = localizarMunicipio(cidade);
    if (municipio.isEmpty()) {
      LOGGER.warn("Município não encontrado no IBGE para {}-{}", cidade.getNome(), cidade.getUf());
      return List.of();
    }

    String url = MUNICIPIOS_URL + "/" + municipio.get().id() + "/distritos";
    Mono<List<DistritoDTO>> distritosRequisicao = webClient
      .get()
      .uri(url)
      .retrieve()
      .bodyToMono(DistritoDTO[].class)
      .map(Arrays::asList);

    return executarRequisicao(
      distritosRequisicao,
      String.format("Erro ao consultar distritos do IBGE para %s-%s", cidade.getNome(), cidade.getUf())
    )
      .orElse(List.of());
  }

  private Optional<MunicipioDTO> localizarMunicipio(Cidade cidade) {
    DadosCidade dadosCidade = extrairDadosCidade(cidade);
    String nomeParaConsulta = prepararNomeParaConsulta(dadosCidade.nomeCidade());
    if (nomeParaConsulta.isBlank()) {
      return Optional.empty();
    }
    String queryUrl = UriComponentsBuilder
      .fromHttpUrl(MUNICIPIOS_URL)
      .queryParam("nome", nomeParaConsulta)
      .toUriString();
    Mono<MunicipioDTO> municipioRequisicao = webClient
      .get()
      .uri(queryUrl)
      .retrieve()
      .bodyToMono(MunicipioDTO[].class)
      .map(resultados -> Arrays
        .stream(resultados)
        .filter(municipio -> correspondeMunicipio(municipio, dadosCidade))
        .findFirst()
        .orElse(null)
      );

    return executarRequisicao(
      municipioRequisicao,
      String.format(
        "Erro ao consultar município no IBGE para %s-%s",
        dadosCidade.nomeCidade(),
        dadosCidade.uf()
      )
    );
  }

  private boolean correspondeMunicipio(MunicipioDTO municipio, DadosCidade dadosCidade) {
    if (municipio == null || municipio.microrregiao() == null) {
      return false;
    }
    String ufRetornada = municipio.microrregiao().mesorregiao().uf().sigla();
    if (!ufRetornada.equalsIgnoreCase(dadosCidade.uf())) {
      return false;
    }
    String nomeMunicipio = normalizar(municipio.nome());
    String nomeCidade = normalizar(dadosCidade.nomeCidade());
    return nomeMunicipio.equals(nomeCidade);
  }

  private DadosCidade extrairDadosCidade(Cidade cidade) {
    if (cidade == null) {
      return new DadosCidade("", "");
    }

    String nome = cidade.getNome() == null ? "" : cidade.getNome().trim();
    String uf = cidade.getUf() == null ? "" : cidade.getUf().trim();

    int indiceSeparador = nome.lastIndexOf('-');
    if (indiceSeparador >= 0) {
      String parteUf = nome.substring(indiceSeparador + 1).trim();
      if (!parteUf.isBlank()) {
        uf = parteUf;
      }
      nome = nome.substring(0, indiceSeparador).trim();
    }

    return new DadosCidade(nome, uf.toUpperCase(Locale.ROOT));
  }

  private String prepararNomeParaConsulta(String nomeCidade) {
    if (nomeCidade == null || nomeCidade.isBlank()) {
      return "";
    }
    return Normalizer
      .normalize(nomeCidade, Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
      .replaceAll("\\s+", " ")
      .trim();
  }

  private String normalizar(String valor) {
    if (valor == null) {
      return "";
    }
    return Normalizer
      .normalize(valor, Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
      .toUpperCase(Locale.ROOT)
      .replaceAll("\\s+", " ")
      .trim();
  }

  private <T> Optional<T> executarRequisicao(Mono<T> requisicao, String mensagemErro) {
    try {
      return requisicao.blockOptional();
    } catch (WebClientResponseException excecaoResposta) {
      LOGGER.warn(
        "{} - status {}: {}",
        mensagemErro,
        excecaoResposta.getStatusCode(),
        excecaoResposta.getMessage()
      );
    } catch (RuntimeException excecaoGenerica) {
      LOGGER.warn("{}: {}", mensagemErro, excecaoGenerica.getMessage());
    }
    return Optional.empty();
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record DistritoDTO(@JsonProperty("nome") String nome) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record MunicipioDTO(
    @JsonProperty("id") Long id,
    @JsonProperty("nome") String nome,
    @JsonProperty("microrregiao") MicrorregiaoDTO microrregiao
  ) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record MicrorregiaoDTO(@JsonProperty("mesorregiao") MesorregiaoDTO mesorregiao) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record MesorregiaoDTO(@JsonProperty("UF") UfDTO uf) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record UfDTO(@JsonProperty("sigla") String sigla) {}

  private record DadosCidade(String nomeCidade, String uf) {}
}
