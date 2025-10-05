package com.gestorpolitico.controller;

import com.gestorpolitico.dto.FamiliaFiltroRequestDTO;
import com.gestorpolitico.dto.FamiliaListaResponseDTO;
import com.gestorpolitico.dto.FamiliaRequestDTO;
import com.gestorpolitico.dto.FamiliaResponseDTO;
import com.gestorpolitico.service.FamiliaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/familias")
public class FamiliaController {
  private final FamiliaService familiaService;

  public FamiliaController(FamiliaService familiaService) {
    this.familiaService = familiaService;
  }

  @PostMapping
  public ResponseEntity<FamiliaResponseDTO> criarFamilia(@Valid @RequestBody FamiliaRequestDTO request) {
    FamiliaResponseDTO familia = familiaService.salvarFamilia(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(familia);
  }

  @GetMapping("/{id}")
  public ResponseEntity<FamiliaResponseDTO> buscarFamilia(@PathVariable Long id) {
    FamiliaResponseDTO familia = familiaService.buscarFamilia(id);
    return ResponseEntity.ok(familia);
  }

  @GetMapping
  public ResponseEntity<FamiliaListaResponseDTO> listarFamilias(
    FamiliaFiltroRequestDTO filtro,
    @RequestParam(defaultValue = "0") int pagina,
    @RequestParam(defaultValue = "20") int tamanho
  ) {
    int paginaAjustada = Math.max(pagina, 0);
    int tamanhoAjustado = Math.min(Math.max(tamanho, 1), 200);
    Pageable pageable = PageRequest.of(paginaAjustada, tamanhoAjustado, Sort.by(Sort.Direction.DESC, "criadoEm"));
    FamiliaListaResponseDTO familias = familiaService.buscarFamilias(filtro, pageable);
    return ResponseEntity.ok(familias);
  }

  @PutMapping("/{id}")
  public ResponseEntity<FamiliaResponseDTO> atualizarFamilia(
    @PathVariable Long id,
    @Valid @RequestBody FamiliaRequestDTO request
  ) {
    FamiliaResponseDTO familia = familiaService.atualizarFamilia(id, request);
    return ResponseEntity.ok(familia);
  }
}
