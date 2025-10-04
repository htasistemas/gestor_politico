package com.gestorpolitico.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
  private static final Pattern CEP_PATTERN = Pattern.compile("(?i)\\bCEP\\s*\\d{5}-?\\d{3}\\b");
  private static final Pattern PONTUACAO_PATTERN = Pattern.compile("[,;]");
  private static final Pattern ESPACOS_PATTERN = Pattern.compile("\\s+");
  private static final Map<String, String> ESTADOS_SIGLAS =
    Map.ofEntries(
      Map.entry("AC", "Acre"),
      Map.entry("AL", "Alagoas"),
      Map.entry("AP", "Amapa"),
      Map.entry("AM", "Amazonas"),
      Map.entry("BA", "Bahia"),
      Map.entry("CE", "Ceara"),
      Map.entry("DF", "Distrito Federal"),
      Map.entry("ES", "Espirito Santo"),
      Map.entry("GO", "Goias"),
      Map.entry("MA", "Maranhao"),
      Map.entry("MT", "Mato Grosso"),
      Map.entry("MS", "Mato Grosso do Sul"),
      Map.entry("MG", "Minas Gerais"),
      Map.entry("PA", "Para"),
      Map.entry("PB", "Paraiba"),
      Map.entry("PR", "Parana"),
      Map.entry("PE", "Pernambuco"),
      Map.entry("PI", "Piaui"),
      Map.entry("RJ", "Rio de Janeiro"),
      Map.entry("RN", "Rio Grande do Norte"),
      Map.entry("RS", "Rio Grande do Sul"),
      Map.entry("RO", "Rondonia"),
      Map.entry("RR", "Roraima"),
      Map.entry("SC", "Santa Catarina"),
      Map.entry("SP", "Sao Paulo"),
      Map.entry("SE", "Sergipe"),
      Map.entry("TO", "Tocantins")
    );

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
    Optional<Coordenada> coordenada = consultarNominatim(enderecoCompleto);
    if (coordenada.isPresent()) {
      return coordenada;
    }

    String enderecoNormalizado = normalizarEndereco(enderecoCompleto);
    if (!enderecoNormalizado.isBlank() && !enderecoNormalizado.equals(enderecoCompleto)) {
      LOGGER.info("Tentando geocodificação com endereço normalizado: {}", enderecoNormalizado);
      return consultarNominatim(enderecoNormalizado);
    }

    return Optional.empty();
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

  private Optional<Coordenada> consultarNominatim(String endereco) {
    LOGGER.info("Consultando Nominatim com endereço: {}", endereco);

    URI uri = UriComponentsBuilder
      .fromHttpUrl(nominatimUrl)
      .queryParam("q", endereco)
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
        LOGGER.warn("Nominatim não retornou resultados para: {}", endereco);
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

  private String normalizarEndereco(String endereco) {
    String enderecoSemAcento = Normalizer.normalize(endereco, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    String enderecoSemCep = CEP_PATTERN.matcher(enderecoSemAcento).replaceAll("");
    String enderecoExpandido = expandirSiglasEstado(enderecoSemCep);
    String semPontuacao = PONTUACAO_PATTERN.matcher(enderecoExpandido).replaceAll(" ");
    semPontuacao = semPontuacao.replace('-', ' ');
    String semEspacosExtras = ESPACOS_PATTERN.matcher(semPontuacao).replaceAll(" ").trim();
    return semEspacosExtras;
  }

  private String expandirSiglasEstado(String endereco) {
    String resultado = endereco;
    for (Map.Entry<String, String> entry : ESTADOS_SIGLAS.entrySet()) {
      String regex = "(?i)\\b" + entry.getKey() + "\\b";
      Matcher matcher = Pattern.compile(regex).matcher(resultado);
      resultado = matcher.replaceAll(Matcher.quoteReplacement(entry.getValue()));
    }
    return resultado;
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
