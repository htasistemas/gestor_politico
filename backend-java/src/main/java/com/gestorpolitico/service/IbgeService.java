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
    return webClient
      .get()
      .uri(url)
      .retrieve()
      .bodyToMono(DistritoDTO[].class)
      .onErrorResume(throwable -> {
        LOGGER.warn("Erro ao consultar distritos do IBGE: {}", throwable.getMessage());
        return Mono.just(new DistritoDTO[0]);
      })
      .map(Arrays::asList)
      .blockOptional()
      .orElse(List.of());
  }

  private Optional<MunicipioDTO> localizarMunicipio(Cidade cidade) {
    String queryUrl = UriComponentsBuilder
      .fromHttpUrl(MUNICIPIOS_URL)
      .queryParam("nome", cidade.getNome())
      .toUriString();
    return webClient
      .get()
      .uri(queryUrl)
      .retrieve()
      .bodyToMono(MunicipioDTO[].class)
      .onErrorResume(throwable -> {
        LOGGER.warn("Erro ao consultar município no IBGE: {}", throwable.getMessage());
        return Mono.just(new MunicipioDTO[0]);
      })
      .map(resultados -> Arrays
        .stream(resultados)
        .filter(municipio -> correspondeMunicipio(municipio, cidade))
        .findFirst()
        .orElse(null)
      )
      .blockOptional();
  }

  private boolean correspondeMunicipio(MunicipioDTO municipio, Cidade cidade) {
    if (municipio == null || municipio.microrregiao() == null) {
      return false;
    }
    String ufRetornada = municipio.microrregiao().mesorregiao().uf().sigla();
    if (!ufRetornada.equalsIgnoreCase(cidade.getUf())) {
      return false;
    }
    String nomeMunicipio = normalizar(municipio.nome());
    String nomeCidade = normalizar(cidade.getNome());
    return nomeMunicipio.equals(nomeCidade);
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
}
