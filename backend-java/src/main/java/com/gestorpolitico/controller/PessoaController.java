package com.gestorpolitico.controller;

import com.gestorpolitico.dto.PessoaRequestDTO;
import com.gestorpolitico.dto.PessoaResponseDTO;
import com.gestorpolitico.service.PessoaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pessoas")
public class PessoaController {
  private final PessoaService pessoaService;

  public PessoaController(PessoaService pessoaService) {
    this.pessoaService = pessoaService;
  }

  @PostMapping
  public ResponseEntity<PessoaResponseDTO> criarPessoa(@Valid @RequestBody PessoaRequestDTO dto) {
    PessoaResponseDTO resposta = pessoaService.criarPessoa(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
  }
}
