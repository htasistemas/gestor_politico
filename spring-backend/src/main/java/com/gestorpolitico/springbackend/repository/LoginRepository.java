package com.gestorpolitico.springbackend.repository;

import com.gestorpolitico.springbackend.model.Usuario;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class LoginRepository {
  private final JdbcTemplate jdbcTemplate;
  private final RowMapper<Usuario> usuarioMapper = (rs, rowNum) -> {
    Usuario usuario = new Usuario();
    usuario.setId(rs.getLong("id"));
    usuario.setUsuario(rs.getString("usuario"));
    usuario.setSenha(rs.getString("senha"));
    usuario.setNome(rs.getString("nome"));
    return usuario;
  };

  public LoginRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public Optional<Usuario> buscarPorCredenciais(String usuario, String senha) {
    return jdbcTemplate.query(
      "SELECT id, usuario, senha, nome FROM login WHERE usuario = ? AND senha = ?",
      usuarioMapper,
      usuario,
      senha
    ).stream().findFirst();
  }
}
