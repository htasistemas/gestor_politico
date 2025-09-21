package com.gestorpolitico.springbackend.service;

import com.gestorpolitico.springbackend.dto.FamiliaRequest;
import com.gestorpolitico.springbackend.dto.FamiliaResponse;
import com.gestorpolitico.springbackend.repository.FamiliaRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FamiliaService {
  private final FamiliaRepository familiaRepository;

  public FamiliaService(FamiliaRepository familiaRepository) {
    this.familiaRepository = familiaRepository;
  }

  public List<FamiliaResponse> listarFamilias() {
    return familiaRepository.listarFamilias();
  }

  public FamiliaResponse criarFamilia(FamiliaRequest request) {
    return familiaRepository.salvarFamilia(request);
  }
}
