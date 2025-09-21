package com.gestorpolitico.config;

import com.gestorpolitico.domain.Login;
import com.gestorpolitico.repository.LoginRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
  private final LoginRepository loginRepository;

  @Override
  public void run(String... args) {
    loginRepository.findByUsuario("admin@plataforma.gov")
      .orElseGet(() -> loginRepository.save(Login.builder()
        .usuario("admin@plataforma.gov")
        .senha("123456")
        .nome("Administrador")
        .build()));
  }
}
