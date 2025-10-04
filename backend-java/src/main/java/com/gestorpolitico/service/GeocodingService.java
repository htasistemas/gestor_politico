package com.gestorpolitico.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.net.URI;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

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
      LOGGER.debug("Geocoding ignorado, endereço vazio");
      return Optional.empty();
    }
    LOGGER.info("Consultando Nominatim com endereço: {}", enderecoCompleto);

    URI uri = UriComponentsBuilder
      .fromHttpUrl(NOMINATIM_URL)
      .queryParam("q", enderecoCompleto)
      .queryParam("format", "json")
      .queryParam("limit", "1")
      .queryParam("addressdetails", "0")
      .queryParam("countrycodes", "br")
      .build()
      .toUri();

    try {
      NominatimResponse[] respostas = webClient.get().uri(uri).retrieve().bodyToMono(NominatimResponse[].class).block();

      if (respostas == null || respostas.length == 0) {
        LOGGER.info("Nominatim não retornou resultados para: {}", enderecoCompleto);
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
      LOGGER.warn("Falha ao consultar Nominatim: {}", ex.getMessage());
      return Optional.empty();

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
