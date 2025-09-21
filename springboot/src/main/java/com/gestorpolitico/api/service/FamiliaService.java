package com.gestorpolitico.api.service;

import com.gestorpolitico.api.dto.FamiliaRequest;
import com.gestorpolitico.api.dto.FamiliaResponse;
import com.gestorpolitico.api.dto.LoginRequest;
import com.gestorpolitico.api.dto.LoginResponse;
import com.gestorpolitico.api.dto.MembroFamiliaRequest;
import com.gestorpolitico.api.dto.MembroFamiliaResponse;
import com.gestorpolitico.api.dto.UsuarioDto;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class FamiliaService {
  private final AtomicLong sequence = new AtomicLong(1);

  public LoginResponse autenticar(LoginRequest request) {
    UsuarioDto usuario = new UsuarioDto(1L, request.getUsuario(), "Administrador");
    return new LoginResponse(true, usuario);
  }

  public List<FamiliaResponse> listarFamilias() {
    FamiliaResponse familia = new FamiliaResponse();
    familia.setId(1L);
    familia.setEndereco("Rua das Flores, 123");
    familia.setBairro("Centro");
    familia.setTelefone("11999990000");
    familia.setCriadoEm(OffsetDateTime.now());

    MembroFamiliaResponse membro = new MembroFamiliaResponse();
    membro.setId(1L);
    membro.setNomeCompleto("Maria Silva");
    membro.setParentesco("Mãe");
    membro.setProbabilidadeVoto("Alta");
    membro.setResponsavelPrincipal(true);
    membro.setProfissao("Professora");
    membro.setTelefone("11988887777");
    membro.setCriadoEm(OffsetDateTime.now());

    familia.setMembros(List.of(membro));
    return List.of(familia);
  }

  public FamiliaResponse criarFamilia(FamiliaRequest request) {
    FamiliaResponse familia = new FamiliaResponse();
    familia.setId(sequence.getAndIncrement());
    familia.setEndereco(request.getEndereco());
    familia.setBairro(request.getBairro());
    familia.setTelefone(request.getTelefone());
    familia.setCriadoEm(OffsetDateTime.now());

    List<MembroFamiliaResponse> membros = new ArrayList<>();
    long membroId = 1L;
    for (MembroFamiliaRequest membroRequest : request.getMembros()) {
      MembroFamiliaResponse membro = new MembroFamiliaResponse();
      membro.setId(membroId++);
      membro.setNomeCompleto(membroRequest.getNomeCompleto());
      membro.setParentesco(membroRequest.getParentesco());
      membro.setProbabilidadeVoto(membroRequest.getProbabilidadeVoto());
      membro.setResponsavelPrincipal(membroRequest.getResponsavelPrincipal());
      membro.setProfissao(membroRequest.getProfissao());
      membro.setTelefone(membroRequest.getTelefone());
      membro.setCriadoEm(OffsetDateTime.now());
      membros.add(membro);
    }
    familia.setMembros(membros);
    return familia;
  }
}
