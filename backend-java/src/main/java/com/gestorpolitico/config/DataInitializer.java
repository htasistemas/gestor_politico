package com.gestorpolitico.config;

import com.gestorpolitico.entity.Login;
import com.gestorpolitico.repository.LoginRepository;
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
}
