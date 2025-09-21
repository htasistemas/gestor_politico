package com.gestorpolitico.web;

import com.gestorpolitico.service.LoginService;
import com.gestorpolitico.web.dto.LoginRequest;
import com.gestorpolitico.web.dto.LoginResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoginController {
  private final LoginService loginService;

  @PostMapping("/login")
  public LoginResponse autenticar(@Valid @RequestBody LoginRequest request) {
    return loginService.autenticar(request);
  }
}
