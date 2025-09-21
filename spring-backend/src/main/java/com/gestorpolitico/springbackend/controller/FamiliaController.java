package com.gestorpolitico.springbackend.controller;

import com.gestorpolitico.springbackend.dto.FamiliaRequest;
import com.gestorpolitico.springbackend.dto.FamiliaResponse;
import com.gestorpolitico.springbackend.service.FamiliaService;
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

  @GetMapping
  public ResponseEntity<List<FamiliaResponse>> listar() {
    return ResponseEntity.ok(familiaService.listarFamilias());
  }

  @PostMapping
  public ResponseEntity<FamiliaResponse> criar(@Valid @RequestBody FamiliaRequest request) {
    FamiliaResponse response = familiaService.criarFamilia(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
