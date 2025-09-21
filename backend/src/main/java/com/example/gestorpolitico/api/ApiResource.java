package com.example.gestorpolitico.api;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class ApiResource {
  private final JdbcTemplate jdbcTemplate;

  public ApiResource(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @PostMapping("/login")
  public ResponseEntity<?> autenticar(@RequestBody LoginRequest request) {
    if (request.usuario() == null || request.usuario().isBlank() || request.senha() == null || request.senha().isBlank()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("success", false, "message", "Credenciais incompletas"));
    }

    try {
      List<Map<String, Object>> usuarios = jdbcTemplate.query(
        "SELECT id, usuario, nome FROM login WHERE usuario = ? AND senha = ?",
        (rs, rowNum) -> {
          Map<String, Object> usuario = new HashMap<>();
          usuario.put("id", rs.getLong("id"));
          usuario.put("usuario", rs.getString("usuario"));
          usuario.put("nome", rs.getString("nome"));
          return usuario;
        },
        request.usuario(),
        request.senha()
      );

      if (usuarios.size() == 1) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("success", true);
        corpo.put("user", usuarios.get(0));
        return ResponseEntity.ok(corpo);
      }

      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("success", false, "message", "Credenciais inválidas"));
    } catch (DataAccessException ex) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("success", false, "message", "Erro no servidor"));
    }
  }

  @GetMapping("/familias")
  public ResponseEntity<?> listarFamilias() {
    try {
      List<Long> ids = jdbcTemplate.query(
        "SELECT id FROM familia ORDER BY criado_em DESC",
        (rs, rowNum) -> rs.getLong("id")
      );

      List<FamilyResponse> familias = new ArrayList<>();
      for (Long id : ids) {
        familias.add(carregarFamilia(id));
      }

      return ResponseEntity.ok(familias);
    } catch (DataAccessException ex) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("success", false, "message", "Erro ao listar famílias"));
    }
  }

  @PostMapping("/familias")
  @Transactional
  public ResponseEntity<?> criarFamilia(@RequestBody FamilyRequest request) {
    if (request.endereco() == null || request.endereco().isBlank() || request.bairro() == null || request.bairro().isBlank() || request.telefone() == null || request.telefone().isBlank()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("success", false, "message", "Dados da família incompletos."));
    }

    if (request.membros() == null || request.membros().isEmpty()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("success", false, "message", "Informe ao menos um membro da família."));
    }

    boolean possuiResponsavel = request.membros().stream()
      .filter(Objects::nonNull)
      .anyMatch(FamilyMemberRequest::responsavelPrincipalAsBoolean);

    if (!possuiResponsavel) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("success", false, "message", "Defina um responsável principal para a família."));
    }

    for (FamilyMemberRequest membro : request.membros()) {
      if (membro == null || membro.nomeCompleto() == null || membro.nomeCompleto().isBlank() || membro.parentesco() == null || membro.parentesco().isBlank() || membro.probabilidadeVoto() == null || membro.probabilidadeVoto().isBlank()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("success", false, "message", "Dados do membro incompletos."));
      }
    }

    try {
      KeyHolder keyHolder = new GeneratedKeyHolder();
      jdbcTemplate.update(connection -> {
        PreparedStatement ps = connection.prepareStatement(
          "INSERT INTO familia (endereco, bairro, telefone) VALUES (?, ?, ?) RETURNING id",
          Statement.RETURN_GENERATED_KEYS
        );
        ps.setString(1, request.endereco());
        ps.setString(2, request.bairro());
        ps.setString(3, request.telefone());
        return ps;
      }, keyHolder);

      Number idGerado = keyHolder.getKey();
      if (idGerado == null) {
        throw new DataAccessException("Não foi possível obter o ID da família criada") {};
      }
      long familiaId = idGerado.longValue();

      for (FamilyMemberRequest membro : request.membros()) {
        jdbcTemplate.update(connection -> {
          PreparedStatement ps = connection.prepareStatement(
            "INSERT INTO membro_familia (familia_id, nome_completo, data_nascimento, profissao, parentesco, responsavel_principal, probabilidade_voto, telefone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          );
          ps.setLong(1, familiaId);
          ps.setString(2, membro.nomeCompleto());
          if (membro.dataNascimento() != null) {
            ps.setDate(3, Date.valueOf(membro.dataNascimento()));
          } else {
            ps.setNull(3, Types.DATE);
          }
          if (membro.profissao() != null) {
            ps.setString(4, membro.profissao());
          } else {
            ps.setNull(4, Types.VARCHAR);
          }
          ps.setString(5, membro.parentesco());
          ps.setBoolean(6, membro.responsavelPrincipalAsBoolean());
          ps.setString(7, membro.probabilidadeVoto());
          if (membro.telefone() != null) {
            ps.setString(8, membro.telefone());
          } else {
            ps.setNull(8, Types.VARCHAR);
          }
          return ps;
        });
      }

      FamilyResponse familia = carregarFamilia(familiaId);
      Map<String, Object> corpo = new HashMap<>();
      corpo.put("success", true);
      corpo.put("id", familiaId);
      corpo.put("familia", familia);
      return ResponseEntity.status(HttpStatus.CREATED).body(corpo);
    } catch (DataAccessException ex) {
      TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("success", false, "message", "Erro ao cadastrar família."));
    }
  }

  private FamilyResponse carregarFamilia(Long familiaId) {
    Map<String, Object> dadosFamilia = jdbcTemplate.queryForMap(
      "SELECT id, endereco, bairro, telefone, criado_em FROM familia WHERE id = ?",
      familiaId
    );

    List<FamilyMemberResponse> membros = jdbcTemplate.query(
      "SELECT id, nome_completo, data_nascimento, profissao, parentesco, responsavel_principal, probabilidade_voto, telefone, criado_em FROM membro_familia WHERE familia_id = ? ORDER BY criado_em DESC",
      (rs, rowNum) -> new FamilyMemberResponse(
        rs.getLong("id"),
        rs.getString("nome_completo"),
        rs.getObject("data_nascimento", LocalDate.class),
        rs.getString("profissao"),
        rs.getString("parentesco"),
        rs.getBoolean("responsavel_principal"),
        rs.getString("probabilidade_voto"),
        rs.getString("telefone"),
        toLocalDateTime(rs.getTimestamp("criado_em"))
      ),
      familiaId
    );

    Timestamp criadoEm = (Timestamp) dadosFamilia.get("criado_em");

    return new FamilyResponse(
      ((Number) dadosFamilia.get("id")).longValue(),
      (String) dadosFamilia.get("endereco"),
      (String) dadosFamilia.get("bairro"),
      (String) dadosFamilia.get("telefone"),
      toLocalDateTime(criadoEm),
      membros
    );
  }

  private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
    return timestamp != null ? timestamp.toLocalDateTime() : null;
  }

  public record LoginRequest(String usuario, String senha) {}

  public record FamilyRequest(String endereco, String bairro, String telefone, List<FamilyMemberRequest> membros) {}

  public record FamilyMemberRequest(
    String nomeCompleto,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate dataNascimento,
    String profissao,
    String parentesco,
    Object responsavelPrincipal,
    String probabilidadeVoto,
    String telefone
  ) {
    boolean responsavelPrincipalAsBoolean() {
      if (responsavelPrincipal instanceof Boolean valorBooleano) {
        return Boolean.TRUE.equals(valorBooleano);
      }
      if (responsavelPrincipal instanceof String valorTexto) {
        return Boolean.parseBoolean(valorTexto);
      }
      return responsavelPrincipal != null;
    }
  }

  public record FamilyResponse(
    Long id,
    String endereco,
    String bairro,
    String telefone,
    LocalDateTime criadoEm,
    List<FamilyMemberResponse> membros
  ) {}

  public record FamilyMemberResponse(
    Long id,
    String nomeCompleto,
    LocalDate dataNascimento,
    String profissao,
    String parentesco,
    Boolean responsavelPrincipal,
    String probabilidadeVoto,
    String telefone,
    LocalDateTime criadoEm
  ) {}
}
