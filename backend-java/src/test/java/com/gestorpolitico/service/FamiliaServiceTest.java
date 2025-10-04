package com.gestorpolitico.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gestorpolitico.dto.FamiliaRequestDTO;
import com.gestorpolitico.dto.MembroFamiliaRequestDTO;
import com.gestorpolitico.entity.Bairro;
import com.gestorpolitico.entity.Cidade;
import com.gestorpolitico.entity.Endereco;
import com.gestorpolitico.entity.Familia;
import com.gestorpolitico.entity.MembroFamilia;
import com.gestorpolitico.enums.Parentesco;
import com.gestorpolitico.repository.BairroRepository;
import com.gestorpolitico.repository.CidadeRepository;
import com.gestorpolitico.repository.FamiliaRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import com.gestorpolitico.service.CepService.CepResultado;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FamiliaServiceTest {
  @Mock
  private FamiliaRepository familiaRepository;

  @Mock
  private CidadeRepository cidadeRepository;

  @Mock
  private BairroRepository bairroRepository;

  @Mock
  private RegiaoRepository regiaoRepository;

  @Mock
  private GeocodingService geocodingService;

  @Mock
  private CepService cepService;

  @InjectMocks
  private FamiliaService familiaService;

  @Captor
  private ArgumentCaptor<Familia> familiaCaptor;

  @Captor
  private ArgumentCaptor<String> enderecoCompletoCaptor;

  @BeforeEach
  void configurarMocksBasicos() {
    when(bairroRepository.findByCidadeIdOrderByNomeAsc(1L)).thenReturn(Collections.emptyList());
    when(bairroRepository.save(any(Bairro.class))).thenAnswer(invocation -> {
      Bairro bairro = invocation.getArgument(0);
      if (bairro.getNome() != null) {
        bairro.setNomeNormalizado(bairro.getNome().toLowerCase(Locale.ROOT));
      }
      bairro.setId(5L);
      return bairro;
    });

    when(familiaRepository.save(any(Familia.class))).thenAnswer(invocation -> {
      Familia familia = invocation.getArgument(0);
      familia.setId(10L);
      for (MembroFamilia membro : familia.getMembros()) {
        membro.setId(20L);
      }
      return familia;
    });
  }

  @Test
  void deveConsultarNominatimEAtribuirCoordenadasAoSalvarFamilia() {
    Cidade cidade = new Cidade();
    cidade.setId(1L);
    cidade.setNome("São Paulo");
    cidade.setUf("SP");
    when(cidadeRepository.findById(1L)).thenReturn(Optional.of(cidade));

    CepResultado cepResultado = new CepResultado(
      "01001000",
      "Praça da Sé",
      "Sé",
      "São Paulo",
      "SP",
      "3550308"
    );
    when(cepService.consultarCep("01001000")).thenReturn(Optional.of(cepResultado));

    GeocodingService.Coordenada coordenada = new GeocodingService.Coordenada(1.234567, -46.876543);
    when(geocodingService.buscarCoordenadas(any(String.class))).thenReturn(Optional.of(coordenada));

    FamiliaRequestDTO request = criarRequestFamilia();

    familiaService.salvarFamilia(request);

    verify(geocodingService).buscarCoordenadas(enderecoCompletoCaptor.capture());
    String enderecoConsultado = enderecoCompletoCaptor.getValue();
    assertTrue(enderecoConsultado.contains("Praça da Sé"));
    assertTrue(enderecoConsultado.contains("01001000"));

    verify(familiaRepository).save(familiaCaptor.capture());
    Endereco endereco = familiaCaptor.getValue().getEnderecoDetalhado();
    assertEquals(BigDecimal.valueOf(1.234567), endereco.getLatitude());
    assertEquals(BigDecimal.valueOf(-46.876543), endereco.getLongitude());
  }

  private FamiliaRequestDTO criarRequestFamilia() {
    MembroFamiliaRequestDTO membro = new MembroFamiliaRequestDTO();
    membro.setNomeCompleto("Maria Silva");
    membro.setDataNascimento(LocalDate.of(1990, 1, 1));
    membro.setProfissao("Professora");
    membro.setParentesco(Parentesco.RESPONSAVEL);
    membro.setResponsavelPrincipal(true);
    membro.setProbabilidadeVoto("ALTA");
    membro.setTelefone("11999999999");

    FamiliaRequestDTO request = new FamiliaRequestDTO();
    request.setCep("01001-000");
    request.setRua("Praça da Sé");
    request.setNumero("100");
    request.setCidadeId(1L);
    request.setNovaRegiao(null);
    request.setMembros(List.of(membro));
    return request;
  }
}
