package com.gestorpolitico.web;

import com.gestorpolitico.service.FamiliaService;
import com.gestorpolitico.web.dto.FamiliaRequest;
import com.gestorpolitico.web.dto.FamiliaResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/familias")
@RequiredArgsConstructor
public class FamiliaController {
  private final FamiliaService familiaService;

  @GetMapping
  public List<FamiliaResponse> listar() {
    return familiaService.listar();
  }

  @PostMapping
  public FamiliaResponse criar(@Valid @RequestBody FamiliaRequest request) {
    return familiaService.criar(request);
  }
}
