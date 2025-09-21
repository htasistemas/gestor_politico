package com.gestorpolitico.springbackend.security;

import com.gestorpolitico.springbackend.model.Usuario;
import com.gestorpolitico.springbackend.service.LoginService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class BearerlessAuthenticationFilter extends OncePerRequestFilter {
  private final LoginService loginService;

  public BearerlessAuthenticationFilter(LoginService loginService) {
    this.loginService = loginService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return "/api/login".equals(path) || !path.startsWith("/api");
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Basic ")) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Credenciais ausentes.");
      return;
    }

    Optional<Usuario> autenticado = extrairCredenciais(header)
      .flatMap(credenciais -> loginService.autenticarUsuario(credenciais.usuario(), credenciais.senha()));

    if (autenticado.isEmpty()) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Credenciais inválidas.");
      return;
    }

    Usuario usuario = autenticado.get();
    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
      usuario,
      null,
      List.of()
    );
    SecurityContextHolder.getContext().setAuthentication(authentication);
    filterChain.doFilter(request, response);
  }

  private Optional<Credenciais> extrairCredenciais(String header) {
    try {
      String base64 = header.substring("Basic ".length());
      byte[] decoded = Base64.getDecoder().decode(base64);
      String token = new String(decoded, StandardCharsets.UTF_8);
      int idx = token.indexOf(':');
      if (idx <= 0) {
        return Optional.empty();
      }
      String usuario = token.substring(0, idx);
      String senha = token.substring(idx + 1);
      return Optional.of(new Credenciais(usuario, senha));
    } catch (IllegalArgumentException ex) {
      return Optional.empty();
    }
  }

  private record Credenciais(String usuario, String senha) {}
}
