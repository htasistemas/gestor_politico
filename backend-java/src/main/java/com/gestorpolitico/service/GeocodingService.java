package com.gestorpolitico.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GeocodingService {
  private static final Logger LOGGER = LoggerFactory.getLogger(GeocodingService.class);
  private static final String USER_AGENT = "gestor-politico/1.0 (contato@gestorpolitico.com)";
  private static final Duration NOMINATIM_RATE_LIMIT = Duration.ofSeconds(1);

  private final WebClient webClient;
  private final String nominatimUrl;
  private final Object rateLimitLock = new Object();
  private Instant lastRequestTime = Instant.EPOCH;

  public GeocodingService(
    WebClient webClient,
    @Value("${geocoding.nominatim.url:https://nominatim.openstreetmap.org/search}") String nominatimUrl
  ) {
    this.webClient = webClient;
    this.nominatimUrl = nominatimUrl;
  }

  public Optional<Coordenada> buscarCoordenadas(String enderecoCompleto) {
    if (enderecoCompleto == null || enderecoCompleto.isBlank()) {
      LOGGER.warn("Geocodificação ignorada porque o endereço está vazio");
      return Optional.empty();
    }
    LOGGER.info("Consultando Nominatim com endereço: {}", enderecoCompleto);

    URI uri = UriComponentsBuilder
      .fromHttpUrl(nominatimUrl)
      .queryParam("q", enderecoCompleto)
      .queryParam("format", "json")
      .queryParam("limit", "1")
      .queryParam("addressdetails", "0")
      .queryParam("countrycodes", "br")
      .encode(StandardCharsets.UTF_8)
      .build()
      .toUri();

    try {
      aplicarLimiteDeTaxa();

      NominatimResponse[] respostas = webClient
        .get()
        .uri(uri)
        .header("User-Agent", USER_AGENT)
        .header("Accept-Language", "pt-BR")
        .retrieve()
        .bodyToMono(NominatimResponse[].class)
        .block();

      if (respostas == null || respostas.length == 0) {
        LOGGER.warn("Nominatim não retornou resultados para: {}", enderecoCompleto);
        return Optional.empty();
      }

      NominatimResponse primeiraResposta = respostas[0];
      Coordenada coordenada = primeiraResposta != null ? primeiraResposta.toCoordenada() : null;
      if (coordenada == null) {
        LOGGER.warn("Primeiro resultado do Nominatim não possui coordenadas válidas");
        return Optional.empty();
      }

      LOGGER.info(
        "Nominatim retornou latitude {} e longitude {}",
        coordenada.latitude(),
        coordenada.longitude()
      );

      return Optional.of(coordenada);
    } catch (Exception ex) {
      LOGGER.warn("Falha ao consultar Nominatim", ex);
      return Optional.empty();

    }
  }

  private void aplicarLimiteDeTaxa() {
    synchronized (rateLimitLock) {
      Instant agora = Instant.now();
      Duration decorrido = Duration.between(lastRequestTime, agora);
      if (decorrido.compareTo(NOMINATIM_RATE_LIMIT) < 0) {
        long aguardarMillis = NOMINATIM_RATE_LIMIT.minus(decorrido).toMillis();
        try {
          Thread.sleep(aguardarMillis);
        } catch (InterruptedException interruptedException) {
          Thread.currentThread().interrupt();
        }
      }
      lastRequestTime = Instant.now();
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class NominatimResponse {
    @JsonProperty("lat")
    private String latitude;

    @JsonProperty("lon")
    private String longitude;

    Coordenada toCoordenada() {
      try {
        Double lat = latitude != null ? Double.valueOf(latitude) : null;
        Double lon = longitude != null ? Double.valueOf(longitude) : null;
        if (lat == null || lon == null) {
          return null;
        }
        return new Coordenada(lat, lon);
      } catch (NumberFormatException ex) {
        LOGGER.warn("Coordenadas inválidas recebidas do Nominatim: {}", ex.getMessage());
        return null;
      }
    }
  }

  public record Coordenada(Double latitude, Double longitude) {}
}
