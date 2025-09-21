package com.gestorpolitico.service;

import com.gestorpolitico.dto.FamiliaRequestDTO;
import com.gestorpolitico.dto.MembroFamiliaRequestDTO;
import com.gestorpolitico.entity.Familia;
import com.gestorpolitico.entity.MembroFamilia;
import com.gestorpolitico.repository.FamiliaRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FamiliaService {
  private final FamiliaRepository familiaRepository;

  public FamiliaService(FamiliaRepository familiaRepository) {
    this.familiaRepository = familiaRepository;
  }

  @Transactional
  public Familia salvarFamilia(FamiliaRequestDTO dto) {
    if (dto.getMembros() == null || dto.getMembros().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos um membro da família.");
    }

    boolean possuiResponsavel = dto.getMembros().stream()
      .map(MembroFamiliaRequestDTO::getResponsavelPrincipal)
      .anyMatch(Boolean.TRUE::equals);

    if (!possuiResponsavel) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Defina um responsável principal para a família.");
    }

    Familia familia = new Familia();
    familia.setEndereco(dto.getEndereco());
    familia.setBairro(dto.getBairro());
    familia.setTelefone(dto.getTelefone());

    List<MembroFamilia> membros = dto.getMembros().stream().map(this::converterMembro).toList();
    membros.forEach(familia::adicionarMembro);

    return familiaRepository.save(familia);
  }

  private MembroFamilia converterMembro(MembroFamiliaRequestDTO dto) {
    MembroFamilia membro = new MembroFamilia();
    membro.setNomeCompleto(dto.getNomeCompleto());
    membro.setDataNascimento(dto.getDataNascimento());
    membro.setProfissao(dto.getProfissao());
    membro.setParentesco(dto.getParentesco());
    membro.setResponsavelPrincipal(Boolean.TRUE.equals(dto.getResponsavelPrincipal()));
    membro.setProbabilidadeVoto(dto.getProbabilidadeVoto());
    membro.setTelefone(dto.getTelefone());
    return membro;
  }
}
