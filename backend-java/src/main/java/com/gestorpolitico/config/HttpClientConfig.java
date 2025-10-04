package com.gestorpolitico.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class HttpClientConfig {
  @Bean
  public WebClient webClient(WebClient.Builder builder) {
    ExchangeStrategies strategies = ExchangeStrategies.builder()
      .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
      .build();

    return builder
      .clone()
      .exchangeStrategies(strategies)
      .defaultHeader("User-Agent", "gestor-politico/1.0 (+https://github.com/gestorpolitico)")
      .build();
  }
}
