package com.gestorpolitico.api.controller;

import com.gestorpolitico.api.dto.FamiliaRequest;
import com.gestorpolitico.api.dto.FamiliaResponse;
import com.gestorpolitico.api.dto.LoginRequest;
import com.gestorpolitico.api.dto.LoginResponse;
import com.gestorpolitico.api.service.FamiliaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Famílias", description = "Gerenciamento de autenticação e famílias")
public class FamiliaController {
  private final FamiliaService familiaService;

  public FamiliaController(FamiliaService familiaService) {
    this.familiaService = familiaService;
  }

  @Operation(
    summary = "Autentica usuário",
    description = "Valida credenciais de acesso e retorna os dados básicos do usuário autenticado."
  )
  @ApiResponse(
    responseCode = "200",
    description = "Autenticação realizada com sucesso",
    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = LoginResponse.class))
  )
  @ApiResponse(
    responseCode = "401",
    description = "Credenciais inválidas"
  )
  @ApiResponse(
    responseCode = "500",
    description = "Erro interno ao processar a autenticação"
  )
  @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    LoginResponse response = familiaService.autenticar(request);
    return ResponseEntity.ok(response);
  }

  @Operation(
    summary = "Lista famílias cadastradas",
    description = "Retorna uma coleção paginável de famílias e seus respectivos membros cadastrados no sistema."
  )
  @ApiResponse(
    responseCode = "200",
    description = "Famílias retornadas com sucesso",
    content = @Content(
      mediaType = MediaType.APPLICATION_JSON_VALUE,
      array = @ArraySchema(schema = @Schema(implementation = FamiliaResponse.class))
    )
  )
  @ApiResponse(
    responseCode = "500",
    description = "Erro ao consultar famílias"
  )
  @GetMapping(path = "/familias")
  public ResponseEntity<List<FamiliaResponse>> listarFamilias() {
    List<FamiliaResponse> familias = familiaService.listarFamilias();
    return ResponseEntity.ok(familias);
  }

  @Operation(
    summary = "Cria uma nova família",
    description = "Cadastra uma família e seus membros, garantindo que exista um responsável principal."
  )
  @ApiResponse(
    responseCode = "201",
    description = "Família criada com sucesso",
    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = FamiliaResponse.class))
  )
  @ApiResponse(
    responseCode = "400",
    description = "Dados inválidos para cadastro"
  )
  @ApiResponse(
    responseCode = "500",
    description = "Erro ao persistir a família"
  )
  @PostMapping(path = "/familias", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<FamiliaResponse> criarFamilia(@Valid @RequestBody FamiliaRequest request) {
    FamiliaResponse familia = familiaService.criarFamilia(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(familia);
  }
}
