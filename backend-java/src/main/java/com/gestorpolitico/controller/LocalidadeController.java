package com.gestorpolitico.controller;

import com.gestorpolitico.dto.AtualizarRegiaoBairrosRequestDTO;
import com.gestorpolitico.dto.BairroResponseDTO;
import com.gestorpolitico.dto.CidadeResponseDTO;
import com.gestorpolitico.dto.ImportacaoBairrosResponseDTO;
import com.gestorpolitico.dto.RegiaoAtribuicaoRequestDTO;
import com.gestorpolitico.dto.RegiaoRequestDTO;
import com.gestorpolitico.dto.RegiaoResponseDTO;
import com.gestorpolitico.service.LocalidadeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LocalidadeController {
  private final LocalidadeService localidadeService;

  public LocalidadeController(LocalidadeService localidadeService) {
    this.localidadeService = localidadeService;
  }

  @GetMapping("/cidades")
  public ResponseEntity<List<CidadeResponseDTO>> listarCidades() {
    return ResponseEntity.ok(localidadeService.listarCidades());
  }

  @GetMapping("/cidades/{cidadeId}/bairros")
  public ResponseEntity<List<BairroResponseDTO>> listarBairros(
    @PathVariable("cidadeId") Long cidadeId,
    @RequestParam(required = false) String regiao
  ) {
    return ResponseEntity.ok(localidadeService.listarBairros(cidadeId, regiao));
  }

  @GetMapping("/cidades/{cidadeId}/regioes")
  public ResponseEntity<List<RegiaoResponseDTO>> listarRegioes(
    @PathVariable("cidadeId") Long cidadeId
  ) {
    return ResponseEntity.ok(localidadeService.listarRegioes(cidadeId));
  }

  @PostMapping("/cidades/{cidadeId}/regioes")
  public ResponseEntity<RegiaoResponseDTO> criarRegiao(
    @PathVariable("cidadeId") Long cidadeId,
    @Valid @RequestBody RegiaoRequestDTO dto
  ) {
    return ResponseEntity.ok(localidadeService.criarRegiao(cidadeId, dto));
  }

  @PutMapping("/regioes/{regiaoId}/bairros")
  public ResponseEntity<Void> atribuirRegiao(
    @PathVariable("regiaoId") Long regiaoId,
    @Valid @RequestBody RegiaoAtribuicaoRequestDTO dto
  ) {
    localidadeService.atribuirRegiao(regiaoId, dto.getBairrosIds());
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/bairros/regiao")
  public ResponseEntity<Void> atualizarRegiaoBairros(
    @Valid @RequestBody AtualizarRegiaoBairrosRequestDTO dto
  ) {
    localidadeService.atualizarRegiaoBairros(dto);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/cidades/{cidadeId}/importar-bairros")
  public ResponseEntity<ImportacaoBairrosResponseDTO> importarBairros(
    @PathVariable("cidadeId") Long cidadeId
  ) {
    return ResponseEntity.ok(localidadeService.importarBairros(cidadeId));
  }
}
