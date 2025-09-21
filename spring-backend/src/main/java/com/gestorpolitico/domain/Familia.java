package com.gestorpolitico.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "familia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Familia {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String endereco;

  @Column(nullable = false, length = 120)
  private String bairro;

  @Column(nullable = false, length = 30)
  private String telefone;

  @CreationTimestamp
  @Column(name = "criado_em", nullable = false, updatable = false)
  private LocalDateTime criadoEm;

  @Builder.Default
  @OneToMany(mappedBy = "familia", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<MembroFamilia> membros = new ArrayList<>();

  public void adicionarMembro(MembroFamilia membro) {
    membros.add(membro);
    membro.setFamilia(this);
  }
}
