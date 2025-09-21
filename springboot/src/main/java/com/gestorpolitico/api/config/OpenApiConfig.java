package com.gestorpolitico.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
  @Bean
  public OpenAPI gestorPoliticoOpenAPI() {
    return new OpenAPI()
      .components(new Components())
      .info(new Info()
        .title("Gestor Político API")
        .description("Documentação OpenAPI baseada na especificação do backend Node.js")
        .version("1.0.0")
        .contact(new Contact()
          .name("Equipe Gestor Político")
          .email("contato@gestorpolitico.com"))
        .license(new License()
          .name("MIT")
          .url("https://opensource.org/licenses/MIT")));
  }
}
