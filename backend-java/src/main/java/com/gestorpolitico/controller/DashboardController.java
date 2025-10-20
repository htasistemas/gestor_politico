package com.gestorpolitico.controller;

import com.gestorpolitico.dto.DashboardAniversarianteResponseDTO;
import com.gestorpolitico.dto.DashboardResumoResponseDTO;
import com.gestorpolitico.dto.DashboardTopParceiroResponseDTO;
import com.gestorpolitico.dto.DistribuicaoProbabilidadeResponseDTO;
import com.gestorpolitico.service.DashboardService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
  private final DashboardService dashboardService;

  public DashboardController(DashboardService dashboardService) {
    this.dashboardService = dashboardService;
  }

  @GetMapping("/resumo")
  public DashboardResumoResponseDTO obterResumo() {
    return dashboardService.obterResumo();
  }

  @GetMapping("/distribuicao-probabilidade")
  public List<DistribuicaoProbabilidadeResponseDTO> obterDistribuicaoProbabilidade() {
    return dashboardService.obterDistribuicaoProbabilidade();
  }

  @GetMapping("/aniversariantes")
  public List<DashboardAniversarianteResponseDTO> listarAniversariantes(
    @RequestParam(name = "mes", required = false) Integer mes
  ) {
    return dashboardService.listarAniversariantes(mes);
  }

  @GetMapping("/top-parceiros")
  public List<DashboardTopParceiroResponseDTO> listarTopParceiros() {
    return dashboardService.buscarTopParceiros(10);
  }
}
