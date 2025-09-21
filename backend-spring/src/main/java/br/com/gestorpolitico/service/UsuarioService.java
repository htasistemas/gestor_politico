package br.com.gestorpolitico.service;

import br.com.gestorpolitico.dto.UsuarioAutenticadoDto;

public interface UsuarioService {
  UsuarioAutenticadoDto autenticar(String usuario, String senha);
}
