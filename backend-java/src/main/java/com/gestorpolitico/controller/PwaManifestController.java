package com.gestorpolitico.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pwa")
public class PwaManifestController {

  private static final String DEFAULT_SCOPE = "/familias/cadastro-parceiro/";

  @GetMapping(value = "/manifest", produces = "application/manifest+json")
  public ResponseEntity<?> obterManifesto(
      @RequestParam(name = "start") String start,
      @RequestParam(name = "scope", required = false) String scopeParam) {

    String startNormalizado = normalizarStart(start);
    if (startNormalizado == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parâmetro 'start' inválido.");
    }

    String scopeNormalizado = normalizarScope(scopeParam);
    if (scopeNormalizado == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parâmetro 'scope' inválido.");
    }

    Map<String, Object> manifesto = new HashMap<>();
    manifesto.put("name", "Gestor Político — Cadastro de Parceiro");
    manifesto.put("short_name", "Gestor Político");
    manifesto.put("start_url", startNormalizado);
    manifesto.put("scope", scopeNormalizado);
    manifesto.put("display", "standalone");
    manifesto.put("theme_color", "#1d4ed8");
    manifesto.put("background_color", "#ffffff");
    manifesto.put("prefer_related_applications", Boolean.FALSE);
    manifesto.put("lang", "pt-BR");

    manifesto.put("icons", criarConfiguracaoDeIcones());

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("application/manifest+json"));
    headers.setCacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().getHeaderValue());

    return new ResponseEntity<>(manifesto, headers, HttpStatus.OK);
  }

  private String normalizarStart(String start) {
    if (!StringUtils.hasText(start)) {
      return null;
    }

    String valor = start.trim();
    if (valor.contains("://")) {
      return null;
    }

    if (!valor.startsWith("/")) {
      valor = "/" + valor;
    }

    try {
      URI uri = new URI(valor);
      String caminho = uri.getPath();
      if (caminho == null || !caminho.startsWith(DEFAULT_SCOPE)) {
        return null;
      }
      StringBuilder resultado = new StringBuilder(caminho);
      if (uri.getQuery() != null && !uri.getQuery().isEmpty()) {
        resultado.append("?").append(uri.getQuery());
      }
      if (uri.getFragment() != null && !uri.getFragment().isEmpty()) {
        resultado.append("#").append(uri.getFragment());
      }
      return resultado.toString();
    } catch (URISyntaxException ex) {
      return null;
    }
  }

  private String normalizarScope(String scopeParam) {
    String scope = scopeParam;
    if (!StringUtils.hasText(scope)) {
      scope = DEFAULT_SCOPE;
    }

    scope = scope.trim();
    if (scope.contains("://")) {
      return null;
    }

    if (!scope.startsWith("/")) {
      scope = "/" + scope;
    }

    if (!scope.endsWith("/")) {
      scope = scope + "/";
    }

    if (!scope.startsWith(DEFAULT_SCOPE)) {
      return null;
    }

    return scope;
  }

  private List<Map<String, Object>> criarConfiguracaoDeIcones() {
    List<Map<String, Object>> icones = new ArrayList<>();

    Map<String, Object> icon192 = new HashMap<>();
    icon192.put("src", "/assets/icons/icon-192.png");
    icon192.put("sizes", "192x192");
    icon192.put("type", "image/png");
    icones.add(icon192);

    Map<String, Object> icon512 = new HashMap<>();
    icon512.put("src", "/assets/icons/icon-512.png");
    icon512.put("sizes", "512x512");
    icon512.put("type", "image/png");
    icones.add(icon512);

    Map<String, Object> iconMaskable512 = new HashMap<>();
    iconMaskable512.put("src", "/assets/icons/maskable-512.png");
    iconMaskable512.put("sizes", "512x512");
    iconMaskable512.put("type", "image/png");
    iconMaskable512.put("purpose", "maskable any");
    icones.add(iconMaskable512);

    return icones;
  }
}
