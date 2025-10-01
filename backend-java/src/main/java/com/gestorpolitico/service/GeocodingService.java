package com.gestorpolitico.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

@Service
public class GeocodingService {
  private static final Logger LOGGER = LoggerFactory.getLogger(GeocodingService.class);
  private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

  private final WebClient webClient;

  public GeocodingService(WebClient webClient) {
    this.webClient = webClient;
  }

  public Optional<Coordenada> buscarCoordenadas(String enderecoCompleto) {
    if (enderecoCompleto == null || enderecoCompleto.isBlank()) {
      return Optional.empty();
    }

    return webClient
      .get()
      .uri(UriComponentsBuilder
        .fromHttpUrl(NOMINATIM_URL)
        .queryParam("q", enderecoCompleto)
        .queryParam("format", "json")
        .queryParam("limit", "1")
        .queryParam("addressdetails", "0")
        .queryParam("countrycodes", "br")
        .build(true)
        .toUri()
      )
      .retrieve()
      .bodyToMono(NominatimResponse[].class)
      .onErrorResume(throwable -> {
        LOGGER.warn("Falha ao consultar Nominatim: {}", throwable.getMessage());
        return Mono.just(new NominatimResponse[0]);
      })
      .map(respostas -> respostas.length > 0 ? respostas[0].toCoordenada() : null)
      .map(Optional::ofNullable)
      .blockOptional()
      .orElse(Optional.empty());
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
