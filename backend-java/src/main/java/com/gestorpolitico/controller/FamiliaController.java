package com.gestorpolitico.controller;

import com.gestorpolitico.dto.FamiliaRequestDTO;
import com.gestorpolitico.dto.FamiliaResponseDTO;
import com.gestorpolitico.service.FamiliaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

  @GetMapping
  public ResponseEntity<List<FamiliaResponseDTO>> listarFamilias() {
    List<FamiliaResponseDTO> familias = familiaService.listarFamilias();
    return ResponseEntity.ok(familias);
  }
}
