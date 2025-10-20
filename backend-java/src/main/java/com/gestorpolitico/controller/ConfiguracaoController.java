package com.gestorpolitico.controller;

import com.gestorpolitico.dto.DashboardMetaRequestDTO;
import com.gestorpolitico.dto.DashboardMetaResponseDTO;
import com.gestorpolitico.service.ConfiguracaoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {
  private final ConfiguracaoService configuracaoService;

  public ConfiguracaoController(ConfiguracaoService configuracaoService) {
    this.configuracaoService = configuracaoService;
  }

  @GetMapping("/dashboard-meta")
  public DashboardMetaResponseDTO obterMetaDashboard() {
    return new DashboardMetaResponseDTO(configuracaoService.obterMetaTotalPessoas().orElse(null));
  }

  @PutMapping("/dashboard-meta")
  public DashboardMetaResponseDTO atualizarMetaDashboard(
    @Valid @RequestBody DashboardMetaRequestDTO request
  ) {
    Long meta = configuracaoService.salvarMetaTotalPessoas(request.getMetaTotalPessoas());
    return new DashboardMetaResponseDTO(meta);
  }
}
