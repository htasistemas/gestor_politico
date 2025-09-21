package com.gestorpolitico.service;

import com.gestorpolitico.domain.Familia;
import com.gestorpolitico.domain.GrauParentesco;
import com.gestorpolitico.domain.MembroFamilia;
import com.gestorpolitico.repository.FamiliaRepository;
import com.gestorpolitico.web.dto.FamiliaRequest;
import com.gestorpolitico.web.dto.FamiliaResponse;
import com.gestorpolitico.web.dto.MembroFamiliaRequest;
import com.gestorpolitico.web.dto.MembroFamiliaResponse;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FamiliaService {
  private final FamiliaRepository familiaRepository;

  public List<FamiliaResponse> listar() {
    return familiaRepository.findAllByOrderByCriadoEmDesc()
      .stream()
      .map(this::converterParaResponse)
      .toList();
  }

  @Transactional
  public FamiliaResponse criar(FamiliaRequest request) {
    validarMembros(request.membros());

    Familia familia = Familia.builder()
      .endereco(request.endereco())
      .bairro(request.bairro())
      .telefone(request.telefone())
      .build();

    request.membros().stream()
      .map(this::converterParaEntidade)
      .forEach(familia::adicionarMembro);

    return converterParaResponse(familiaRepository.save(familia));
  }

  private void validarMembros(List<MembroFamiliaRequest> membros) {
    long quantidadeResponsaveis = membros.stream()
      .filter(membro -> Boolean.TRUE.equals(membro.responsavelPrincipal()))
      .count();

    if (quantidadeResponsaveis == 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Defina um responsável principal para a família.");
    }

    if (quantidadeResponsaveis > 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A família deve possuir apenas um responsável principal.");
    }
  }

  private MembroFamilia converterParaEntidade(MembroFamiliaRequest request) {
    return MembroFamilia.builder()
      .nomeCompleto(request.nomeCompleto())
      .dataNascimento(request.dataNascimento())
      .profissao(request.profissao())
      .parentesco(GrauParentesco.fromValue(request.parentesco()))
      .responsavelPrincipal(Boolean.TRUE.equals(request.responsavelPrincipal()))
      .probabilidadeVoto(request.probabilidadeVoto())
      .telefone(request.telefone())
      .build();
  }

  private FamiliaResponse converterParaResponse(Familia familia) {
    List<MembroFamiliaResponse> membros = familia.getMembros().stream()
      .map(membro -> new MembroFamiliaResponse(
        membro.getId(),
        membro.getNomeCompleto(),
        membro.getDataNascimento(),
        membro.getProfissao(),
        membro.getParentesco() != null ? membro.getParentesco().getValue() : null,
        membro.isResponsavelPrincipal(),
        membro.getProbabilidadeVoto(),
        membro.getTelefone(),
        membro.getCriadoEm()
      ))
      .collect(Collectors.toList());

    return new FamiliaResponse(
      familia.getId(),
      familia.getEndereco(),
      familia.getBairro(),
      familia.getTelefone(),
      familia.getCriadoEm(),
      membros
    );
  }
}
