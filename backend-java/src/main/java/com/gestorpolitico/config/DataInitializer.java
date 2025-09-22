package com.gestorpolitico.config;

import com.gestorpolitico.entity.Bairro;
import com.gestorpolitico.entity.Cidade;
import com.gestorpolitico.entity.Login;
import com.gestorpolitico.entity.Regiao;
import com.gestorpolitico.repository.BairroRepository;
import com.gestorpolitico.repository.CidadeRepository;
import com.gestorpolitico.repository.LoginRepository;
import com.gestorpolitico.repository.RegiaoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
  private static final String DEFAULT_USER = "admin@plataforma.gov";
  private static final String DEFAULT_PASSWORD = "123456";
  private static final String DEFAULT_NAME = "Administrador";

  @Bean
  CommandLineRunner loadDefaultUser(LoginRepository loginRepository) {
    return args -> {
      if (!loginRepository.existsByUsuario(DEFAULT_USER)) {
        Login login = new Login();
        login.setUsuario(DEFAULT_USER);
        login.setSenha(DEFAULT_PASSWORD);
        login.setNome(DEFAULT_NAME);
        loginRepository.save(login);
      }
    };
  }

  @Bean
  CommandLineRunner loadLocalidades(
    CidadeRepository cidadeRepository,
    RegiaoRepository regiaoRepository,
    BairroRepository bairroRepository
  ) {
    return args -> {
      if (cidadeRepository.count() > 0) {
        return;
      }

      Cidade cidade = new Cidade();
      cidade.setNome("São Paulo");
      cidade.setUf("SP");
      Cidade salvo = cidadeRepository.save(cidade);

      Regiao norte = new Regiao();
      norte.setCidade(salvo);
      norte.setNome("Zona Norte");
      regiaoRepository.save(norte);

      Regiao sul = new Regiao();
      sul.setCidade(salvo);
      sul.setNome("Zona Sul");
      regiaoRepository.save(sul);

      salvarBairro(bairroRepository, salvo, "Santana", norte.getNome());
      salvarBairro(bairroRepository, salvo, "Casa Verde", norte.getNome());
      salvarBairro(bairroRepository, salvo, "Moema", sul.getNome());
      salvarBairro(bairroRepository, salvo, "Vila Mariana", sul.getNome());
    };
  }

  private void salvarBairro(BairroRepository bairroRepository, Cidade cidade, String nome, String regiao) {
    if (bairroRepository.findByCidadeIdAndNomeNormalizado(cidade.getId(), normalizar(nome)).isPresent()) {
      return;
    }

    Bairro bairro = new Bairro();
    bairro.setCidade(cidade);
    bairro.setNome(nome);
    bairro.setRegiao(regiao);
    bairroRepository.save(bairro);
  }

  private String normalizar(String valor) {
    return java.text.Normalizer
      .normalize(valor, java.text.Normalizer.Form.NFD)
      .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
      .toUpperCase(java.util.Locale.ROOT)
      .replaceAll("\\s+", " ")
      .trim();
  }
}
