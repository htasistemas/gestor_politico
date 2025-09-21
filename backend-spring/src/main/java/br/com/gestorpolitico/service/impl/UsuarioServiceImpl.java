package br.com.gestorpolitico.service.impl;

import br.com.gestorpolitico.dto.UsuarioAutenticadoDto;
import br.com.gestorpolitico.exception.CredenciaisInvalidasException;
import br.com.gestorpolitico.service.UsuarioService;
import java.sql.ResultSet;
import java.sql.SQLException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

@Service
public class UsuarioServiceImpl implements UsuarioService {
  private static final String LOGIN_SQL =
    "SELECT id, usuario, nome FROM login WHERE usuario = ? AND senha = ?";

  private final JdbcTemplate jdbcTemplate;

  public UsuarioServiceImpl(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public UsuarioAutenticadoDto autenticar(String usuario, String senha) {
    try {
      return jdbcTemplate.queryForObject(
        LOGIN_SQL,
        new UsuarioAutenticadoRowMapper(),
        usuario,
        senha
      );
    } catch (EmptyResultDataAccessException ex) {
      throw new CredenciaisInvalidasException();
    }
  }

  private static class UsuarioAutenticadoRowMapper implements RowMapper<UsuarioAutenticadoDto> {
    @Override
    public UsuarioAutenticadoDto mapRow(ResultSet rs, int rowNum) throws SQLException {
      return new UsuarioAutenticadoDto(
        rs.getLong("id"),
        rs.getString("usuario"),
        rs.getString("nome")
      );
    }
  }
}
