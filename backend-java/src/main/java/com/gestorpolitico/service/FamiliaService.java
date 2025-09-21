package com.gestorpolitico.service;

import com.gestorpolitico.dto.FamiliaRequestDTO;
import com.gestorpolitico.dto.FamiliaResponseDTO;
import com.gestorpolitico.dto.MembroFamiliaRequestDTO;
import com.gestorpolitico.dto.MembroFamiliaResponseDTO;
import com.gestorpolitico.entity.Familia;
import com.gestorpolitico.entity.MembroFamilia;
import com.gestorpolitico.repository.FamiliaRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FamiliaService {
  private final FamiliaRepository familiaRepository;

  public FamiliaService(FamiliaRepository familiaRepository) {
    this.familiaRepository = familiaRepository;
  }

  @Transactional
  public FamiliaResponseDTO salvarFamilia(FamiliaRequestDTO dto) {
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

    Familia salvo = familiaRepository.save(familia);
    return converterFamilia(salvo);
  }

  @Transactional(readOnly = true)
  public List<FamiliaResponseDTO> listarFamilias() {
    return familiaRepository.findAllByOrderByCriadoEmDesc().stream()
      .map(this::converterFamilia)
      .collect(Collectors.toList());
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

  private FamiliaResponseDTO converterFamilia(Familia familia) {
    List<MembroFamiliaResponseDTO> membros = familia.getMembros().stream()
      .map(membro -> new MembroFamiliaResponseDTO(
        membro.getId(),
        membro.getNomeCompleto(),
        membro.getDataNascimento(),
        membro.getProfissao(),
        membro.getParentesco(),
        Boolean.TRUE.equals(membro.getResponsavelPrincipal()),
        membro.getProbabilidadeVoto(),
        membro.getTelefone(),
        membro.getCriadoEm()
      ))
      .collect(Collectors.toList());

    return new FamiliaResponseDTO(
      familia.getId(),
      familia.getEndereco(),
      familia.getBairro(),
      familia.getTelefone(),
      familia.getCriadoEm(),
      membros
    );
  }
}
