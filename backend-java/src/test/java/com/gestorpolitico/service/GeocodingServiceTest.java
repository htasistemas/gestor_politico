package com.gestorpolitico.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Optional;
import okhttp3.HttpUrl;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

class GeocodingServiceTest {
  private MockWebServer mockWebServer;
  private GeocodingService geocodingService;

  @BeforeEach
  void setUp() throws IOException {
    mockWebServer = new MockWebServer();
    mockWebServer.start();
    WebClient webClient = WebClient.builder().build();
    geocodingService = new GeocodingService(webClient, mockWebServer.url("/search").toString());
  }

  @AfterEach
  void tearDown() throws IOException {
    mockWebServer.shutdown();
  }

  @Test
  void deveEnviarRequisicaoNoPadraoEsperadoEConverterResposta() throws InterruptedException {
    mockWebServer.enqueue(
      new MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "application/json")
        .setBody("[{\"lat\":\"-18.9365314\",\"lon\":\"-48.2884139\"}]")
    );

    Optional<GeocodingService.Coordenada> coordenada = geocodingService.buscarCoordenadas(
      "Rua Arpoador 147 Uberlandia Minas Gerais Brasil"
    );

    RecordedRequest recordedRequest = mockWebServer.takeRequest();

    HttpUrl requestUrl = recordedRequest.getRequestUrl();

    assertEquals("/search", requestUrl.encodedPath());
    assertEquals("Rua Arpoador 147 Uberlandia Minas Gerais Brasil", requestUrl.queryParameter("q"));
    assertEquals("json", requestUrl.queryParameter("format"));
    assertEquals("1", requestUrl.queryParameter("limit"));
    assertEquals("0", requestUrl.queryParameter("addressdetails"));
    assertEquals("br", requestUrl.queryParameter("countrycodes"));
    assertEquals("gestor-politico/1.0 (contato@gestorpolitico.com)", recordedRequest.getHeader("User-Agent"));
    assertEquals("pt-BR", recordedRequest.getHeader("Accept-Language"));

    assertTrue(coordenada.isPresent());
    assertEquals(-18.9365314, coordenada.get().latitude());
    assertEquals(-48.2884139, coordenada.get().longitude());
  }

  @Test
  void deveRetornarVazioQuandoNaoHaResultados() throws InterruptedException {
    mockWebServer.enqueue(
      new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody("[]")
    );

    Optional<GeocodingService.Coordenada> coordenada = geocodingService.buscarCoordenadas("Endereco Inexistente");

    mockWebServer.takeRequest();

    assertTrue(coordenada.isEmpty());
  }
}
