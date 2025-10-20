package com.gestorpolitico.service;

import com.gestorpolitico.dto.DashboardAniversarianteResponseDTO;
import com.gestorpolitico.dto.DashboardResumoResponseDTO;
import com.gestorpolitico.dto.DashboardTopParceiroResponseDTO;
import com.gestorpolitico.dto.DistribuicaoProbabilidadeResponseDTO;
import com.gestorpolitico.repository.FamiliaRepository;
import com.gestorpolitico.repository.MembroFamiliaRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
  private final MembroFamiliaRepository membroFamiliaRepository;
  private final FamiliaRepository familiaRepository;
  private final ConfiguracaoService configuracaoService;

  public DashboardService(
    MembroFamiliaRepository membroFamiliaRepository,
    FamiliaRepository familiaRepository,
    ConfiguracaoService configuracaoService
  ) {
    this.membroFamiliaRepository = membroFamiliaRepository;
    this.familiaRepository = familiaRepository;
    this.configuracaoService = configuracaoService;
  }

  @Transactional(readOnly = true)
  public DashboardResumoResponseDTO obterResumo() {
    long totalPessoas = membroFamiliaRepository.count();
    Long meta = configuracaoService.obterMetaTotalPessoas().orElse(null);
    return new DashboardResumoResponseDTO(totalPessoas, meta);
  }

  @Transactional(readOnly = true)
  public List<DistribuicaoProbabilidadeResponseDTO> obterDistribuicaoProbabilidade() {
    return membroFamiliaRepository
      .contarPorProbabilidade()
      .stream()
      .sorted(Comparator.comparing(DistribuicaoProbabilidadeResponseDTO::getQuantidade).reversed())
      .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<DashboardAniversarianteResponseDTO> listarAniversariantes(Integer mes) {
    int mesConsulta = validarMes(mes);
    return membroFamiliaRepository
      .buscarAniversariantesDoMes(mesConsulta)
      .stream()
      .map(membro -> new DashboardAniversarianteResponseDTO(
        membro.getId(),
        membro.getNomeCompleto(),
        membro.getDataNascimento() != null ? membro.getDataNascimento().getDayOfMonth() : 0,
        mesConsulta,
        membro.getFamilia() != null ? membro.getFamilia().getBairro() : null,
        membro.getTelefone()
      ))
      .sorted(Comparator.comparing(DashboardAniversarianteResponseDTO::getDia))
      .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<DashboardTopParceiroResponseDTO> buscarTopParceiros(int limite) {
    return familiaRepository.buscarTopParceiros(PageRequest.of(0, Math.max(limite, 1)));
  }

  private int validarMes(Integer mes) {
    if (mes == null) {
      return LocalDate.now().getMonthValue();
    }
    if (mes < 1 || mes > 12) {
      return LocalDate.now().getMonthValue();
    }
    return mes;
  }
}
