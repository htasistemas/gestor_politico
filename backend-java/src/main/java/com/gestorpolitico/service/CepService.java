package com.gestorpolitico.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Service
public class CepService {
  private static final Logger LOGGER = LoggerFactory.getLogger(CepService.class);
  private static final String CEP_URL = "https://brasilapi.com.br/api/cep/v2/";

  private final WebClient webClient;

  public CepService(WebClient webClient) {
    this.webClient = webClient;
  }

  public Optional<CepResultado> consultarCep(String cep) {
    if (cep == null || cep.isBlank()) {
      return Optional.empty();
    }

    String numerico = cep.replaceAll("\\D", "");
    if (numerico.length() != 8) {
      return Optional.empty();
    }

    Mono<CepResponse> requisicao = webClient
      .get()
      .uri(CEP_URL + numerico)
      .retrieve()
      .bodyToMono(CepResponse.class)
      .doOnError(erro -> LOGGER.warn("Falha ao consultar CEP {}: {}", numerico, erro.getMessage()));

    try {
      return requisicao.map(CepResponse::toResultado).blockOptional();
    } catch (WebClientResponseException excecao) {
      if (excecao.getStatusCode() == HttpStatus.NOT_FOUND) {
        LOGGER.debug("CEP {} não encontrado", numerico);
      } else {
        LOGGER.warn("Erro ao consultar CEP {}: {}", numerico, excecao.getMessage());
      }
      return Optional.empty();
    } catch (RuntimeException erro) {
      LOGGER.warn("Erro inesperado ao consultar CEP {}: {}", numerico, erro.getMessage());
      return Optional.empty();
    }
  }

  public record CepResultado(
    String cep,
    String logradouro,
    String bairro,
    String cidade,
    String uf,
    String codigoIbge,
    Double latitude,
    Double longitude
  ) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class CepResponse {
    @JsonProperty("cep")
    private String cep;

    @JsonProperty("street")
    private String logradouro;

    @JsonProperty("neighborhood")
    private String bairro;

    @JsonProperty("city")
    private String cidade;

    @JsonProperty("state")
    private String uf;

    @JsonProperty("city_ibge")
    private String codigoIbge;

    @JsonProperty("location")
    private Location location;

    CepResultado toResultado() {
      Double latitude = null;
      Double longitude = null;
      if (location != null && location.coordinates != null) {
        latitude = parseDouble(location.coordinates.latitude);
        longitude = parseDouble(location.coordinates.longitude);
      }
      return new CepResultado(cep, logradouro, bairro, cidade, uf, codigoIbge, latitude, longitude);
    }

    private Double parseDouble(String valor) {
      if (valor == null || valor.isBlank()) {
        return null;
      }
      try {
        return Double.valueOf(valor);
      } catch (NumberFormatException ex) {
        LOGGER.warn("Coordenada inválida recebida para o CEP {}: {}", cep, valor);
        return null;
      }
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class Location {
    @JsonProperty("coordinates")
    private Coordinates coordinates;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class Coordinates {
    @JsonProperty("latitude")
    private String latitude;

    @JsonProperty("longitude")
    private String longitude;
  }
}
