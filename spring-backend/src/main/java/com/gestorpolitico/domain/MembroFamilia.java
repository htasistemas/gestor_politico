package com.gestorpolitico.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "membro_familia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembroFamilia {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "familia_id", nullable = false)
  private Familia familia;

  @Column(name = "nome_completo", nullable = false, length = 255)
  private String nomeCompleto;

  @Column(name = "data_nascimento")
  private LocalDate dataNascimento;

  @Column(length = 255)
  private String profissao;

  @Column(nullable = false, length = 50)
  private GrauParentesco parentesco;

  @Column(name = "responsavel_principal", nullable = false)
  private boolean responsavelPrincipal;

  @Column(name = "probabilidade_voto", nullable = false, length = 20)
  private String probabilidadeVoto;

  @Column(length = 30)
  private String telefone;

  @CreationTimestamp
  @Column(name = "criado_em", nullable = false, updatable = false)
  private LocalDateTime criadoEm;
}
