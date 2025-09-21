package com.gestorpolitico.springbackend.repository;

import com.gestorpolitico.springbackend.dto.FamiliaRequest;
import com.gestorpolitico.springbackend.dto.FamiliaResponse;
import com.gestorpolitico.springbackend.dto.MembroFamiliaRequest;
import com.gestorpolitico.springbackend.dto.MembroFamiliaResponse;
import com.gestorpolitico.springbackend.model.GrauParentesco;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
public class FamiliaRepository {
  private final JdbcTemplate jdbcTemplate;
  private final TransactionTemplate transactionTemplate;

  public FamiliaRepository(JdbcTemplate jdbcTemplate, PlatformTransactionManager txManager) {
    this.jdbcTemplate = jdbcTemplate;
    this.transactionTemplate = new TransactionTemplate(txManager);
  }

  public FamiliaResponse salvarFamilia(FamiliaRequest request) {
    return transactionTemplate.execute(status -> {
      KeyHolder keyHolder = new GeneratedKeyHolder();
      jdbcTemplate.update(con -> {
        PreparedStatement ps = con.prepareStatement(
          "INSERT INTO familia (endereco, bairro, telefone) VALUES (?, ?, ?)",
          Statement.RETURN_GENERATED_KEYS
        );
        ps.setString(1, request.getEndereco());
        ps.setString(2, request.getBairro());
        ps.setString(3, request.getTelefone());
        return ps;
      }, keyHolder);

      Number key = Optional.ofNullable(keyHolder.getKey())
        .orElseThrow(() -> new IllegalStateException("Não foi possível obter o id da família."));
      Long familiaId = key.longValue();

      for (MembroFamiliaRequest membro : request.getMembros()) {
        inserirMembro(familiaId, membro);
      }

      return buscarPorId(familiaId).orElseThrow(() ->
        new IllegalStateException("Erro ao carregar família recém criada.")
      );
    });
  }

  public List<FamiliaResponse> listarFamilias() {
    String sql =
      "SELECT " +
      "f.id AS f_id, f.endereco, f.bairro, f.telefone, f.criado_em AS f_criado_em, " +
      "m.id AS m_id, m.nome_completo, m.data_nascimento, m.profissao, m.parentesco, " +
      "m.responsavel_principal, m.probabilidade_voto, m.telefone AS m_telefone, m.criado_em AS m_criado_em " +
      "FROM familia f " +
      "LEFT JOIN membro_familia m ON m.familia_id = f.id " +
      "ORDER BY f.criado_em DESC, m.criado_em ASC";

    return jdbcTemplate.query(sql, rs -> {
      Map<Long, FamiliaResponse> familias = new LinkedHashMap<>();
      while (rs.next()) {
        Long familiaId = rs.getLong("f_id");
        FamiliaResponse familia = familias.computeIfAbsent(familiaId, id -> {
          FamiliaResponse response = new FamiliaResponse();
          response.setId(id);
          response.setEndereco(rs.getString("endereco"));
          response.setBairro(rs.getString("bairro"));
          response.setTelefone(rs.getString("telefone"));
          response.setCriadoEm(toOffsetDateTime(rs.getTimestamp("f_criado_em")));
          response.setMembros(new ArrayList<>());
          return response;
        });

        long membroId = rs.getLong("m_id");
        if (!rs.wasNull()) {
          familia.getMembros().add(mapearMembro(rs));
        }
      }
      return new ArrayList<>(familias.values());
    });
  }

  public Optional<FamiliaResponse> buscarPorId(Long id) {
    String sql =
      "SELECT " +
      "f.id AS f_id, f.endereco, f.bairro, f.telefone, f.criado_em AS f_criado_em, " +
      "m.id AS m_id, m.nome_completo, m.data_nascimento, m.profissao, m.parentesco, " +
      "m.responsavel_principal, m.probabilidade_voto, m.telefone AS m_telefone, m.criado_em AS m_criado_em " +
      "FROM familia f " +
      "LEFT JOIN membro_familia m ON m.familia_id = f.id " +
      "WHERE f.id = ? " +
      "ORDER BY m.criado_em ASC";

    List<FamiliaResponse> familias = jdbcTemplate.query(sql, ps -> ps.setLong(1, id), rs -> {
      Map<Long, FamiliaResponse> mapa = new LinkedHashMap<>();
      while (rs.next()) {
        Long familiaId = rs.getLong("f_id");
        FamiliaResponse familia = mapa.computeIfAbsent(familiaId, fid -> {
          FamiliaResponse response = new FamiliaResponse();
          response.setId(fid);
          response.setEndereco(rs.getString("endereco"));
          response.setBairro(rs.getString("bairro"));
          response.setTelefone(rs.getString("telefone"));
          response.setCriadoEm(toOffsetDateTime(rs.getTimestamp("f_criado_em")));
          response.setMembros(new ArrayList<>());
          return response;
        });

        long membroId = rs.getLong("m_id");
        if (!rs.wasNull()) {
          familia.getMembros().add(mapearMembro(rs));
        }
      }
      return new ArrayList<>(mapa.values());
    });
    return familias.stream().findFirst();
  }

  private void inserirMembro(Long familiaId, MembroFamiliaRequest membro) {
    jdbcTemplate.update(con -> {
      PreparedStatement ps = con.prepareStatement(
        "INSERT INTO membro_familia (familia_id, nome_completo, data_nascimento, profissao, parentesco, responsavel_principal, probabilidade_voto, telefone) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );
      ps.setLong(1, familiaId);
      ps.setString(2, membro.getNomeCompleto());
      if (membro.getDataNascimento() != null && !membro.getDataNascimento().isBlank()) {
        LocalDate data = LocalDate.parse(membro.getDataNascimento());
        ps.setDate(3, Date.valueOf(data));
      } else {
        ps.setNull(3, java.sql.Types.DATE);
      }
      ps.setString(4, membro.getProfissao());
      ps.setString(5, membro.getParentesco().toDatabaseValue());
      ps.setBoolean(6, Boolean.TRUE.equals(membro.getResponsavelPrincipal()));
      ps.setString(7, membro.getProbabilidadeVoto());
      ps.setString(8, membro.getTelefone());
      return ps;
    });
  }

  private MembroFamiliaResponse mapearMembro(java.sql.ResultSet rs) throws java.sql.SQLException {
    MembroFamiliaResponse membro = new MembroFamiliaResponse();
    membro.setId(rs.getLong("m_id"));
    membro.setNomeCompleto(rs.getString("nome_completo"));
    Date dataNascimento = rs.getDate("data_nascimento");
    membro.setDataNascimento(dataNascimento != null ? dataNascimento.toLocalDate().toString() : null);
    membro.setProfissao(rs.getString("profissao"));
    membro.setParentesco(rs.getString("parentesco"));
    membro.setResponsavelPrincipal(rs.getBoolean("responsavel_principal"));
    membro.setProbabilidadeVoto(rs.getString("probabilidade_voto"));
    membro.setTelefone(rs.getString("m_telefone"));
    membro.setCriadoEm(toOffsetDateTime(rs.getTimestamp("m_criado_em")));
    return membro;
  }

  private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
    if (timestamp == null) {
      return null;
    }
    return timestamp.toInstant().atOffset(ZoneOffset.UTC);
  }
}
