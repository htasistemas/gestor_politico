package com.gestorpolitico.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PwaManifestController.class)
class PwaManifestControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void deveRetornarManifestoQuandoParametrosValidos() throws Exception {
    mockMvc
        .perform(get("/pwa/manifest")
            .param("start", "/familias/cadastro-parceiro/123?from=a2hs"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", containsString("max-age")))
        .andExpect(content().contentType(MediaType.parseMediaType("application/manifest+json")))
        .andExpect(jsonPath("$.name", equalTo("Gestor Político — Cadastro de Parceiro")))
        .andExpect(jsonPath("$.start_url", equalTo("/familias/cadastro-parceiro/123?from=a2hs")))
        .andExpect(jsonPath("$.scope", equalTo("/familias/cadastro-parceiro/")))
        .andExpect(jsonPath("$.icons[0].src", equalTo("/assets/icons/icon-192.png")))
        .andExpect(jsonPath("$.icons[0].sizes", equalTo("192x192")))
        .andExpect(jsonPath("$.icons[0].type", equalTo("image/png")))
        .andExpect(jsonPath("$.icons[1].src", equalTo("/assets/icons/icon-512.png")))
        .andExpect(jsonPath("$.icons[1].sizes", equalTo("512x512")))
        .andExpect(jsonPath("$.icons[1].type", equalTo("image/png")))
        .andExpect(jsonPath("$.icons[2].src", equalTo("/assets/icons/maskable-512.png")))
        .andExpect(jsonPath("$.icons[2].sizes", equalTo("512x512")))
        .andExpect(jsonPath("$.icons[2].type", equalTo("image/png")))
        .andExpect(jsonPath("$.icons[2].purpose", equalTo("maskable any")));
  }

  @Test
  void deveRetornarErroQuandoStartInvalido() throws Exception {
    mockMvc
        .perform(get("/pwa/manifest")
            .param("start", "https://exemplo.com/fora"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void deveRetornarErroQuandoScopeInvalido() throws Exception {
    mockMvc
        .perform(get("/pwa/manifest")
            .param("start", "/familias/cadastro-parceiro/123")
            .param("scope", "/familias/"))
        .andExpect(status().isBadRequest());
  }
}
