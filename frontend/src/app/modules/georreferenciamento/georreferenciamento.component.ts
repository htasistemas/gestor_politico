import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { FamiliasService, FamiliaResponse, EnderecoFamiliaResponse } from '../familias/familias.service';
interface FamiliaLocalizada {
  id: number;
  responsavel: string;
  enderecoCompleto: string;
  latitude: number;
  longitude: number;
  link: string;
}

@Component({
  standalone: false,
  selector: 'app-georreferenciamento',
  templateUrl: './georreferenciamento.component.html',
  styleUrls: ['./georreferenciamento.component.css']
})
export class GeoReferenciamentoComponent implements OnInit, AfterViewInit, OnDestroy {
  carregando = false;
  erroCarregamento = '';
  familiasLocalizadas: FamiliaLocalizada[] = [];
  private mapa: L.Map | null = null;
  private camadaMarcadores: L.LayerGroup | null = null;
  private assinaturaFamilias: Subscription | null = null;
  private readonly iconeFamilia = L.divIcon({
    html: '<i class="fa-solid fa-house-chimney-window" aria-hidden="true"></i>',
    className: 'familia-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -32]
  });

  constructor(private readonly familiasService: FamiliasService, private readonly router: Router) {}

  ngOnInit(): void {
    this.carregarFamilias();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
    this.atualizarMapa();
  }

  ngOnDestroy(): void {
    this.assinaturaFamilias?.unsubscribe();
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }
  }

  private carregarFamilias(): void {
    this.carregando = true;
    this.erroCarregamento = '';
    this.assinaturaFamilias = this.familiasService.listarTodasFamilias().subscribe({
      next: familias => {
        this.familiasLocalizadas = familias
          .map(familia => this.converterFamilia(familia))
          .filter((familia): familia is FamiliaLocalizada => familia !== null);
        this.carregando = false;
        this.atualizarMapa();
      },
      error: erro => {
        console.error('Erro ao carregar famílias para georreferenciamento', erro);
        this.erroCarregamento = 'Não foi possível carregar as famílias cadastradas.';
        this.carregando = false;
      }
    });
  }

  private inicializarMapa(): void {
    if (this.mapa) {
      return;
    }
    this.mapa = L.map('geo-map', {
      center: [-14.235004, -51.92528],
      zoom: 5,
      attributionControl: false,
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true
    });

    this.mapa.scrollWheelZoom.enable();
    this.mapa.dragging.enable();
    this.mapa.touchZoom.enable();
    this.mapa.doubleClickZoom.enable();
    this.mapa.boxZoom.enable();
    this.mapa.keyboard.enable();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contribuidores'
    }).addTo(this.mapa);
  }

  private atualizarMapa(): void {
    if (!this.mapa) {
      return;
    }

    if (!this.camadaMarcadores) {
      this.camadaMarcadores = L.layerGroup().addTo(this.mapa);
    }
    this.camadaMarcadores.clearLayers();

    if (this.familiasLocalizadas.length === 0) {
      return;
    }

    const coordenadas: L.LatLngExpression[] = [];
    this.familiasLocalizadas.forEach(familia => {
      const marcador = this.criarMarcador(familia);
      marcador.addTo(this.camadaMarcadores as L.LayerGroup);
      coordenadas.push([familia.latitude, familia.longitude]);
    });

    if (coordenadas.length === 1) {
      this.mapa.setView(coordenadas[0], 15);
      return;
    }

    const grupoMaisDenso = this.obterGrupoMaisDenso();
    if (grupoMaisDenso) {
      const limitesGrupo = L.latLngBounds(grupoMaisDenso);
      this.mapa.fitBounds(limitesGrupo, { padding: [40, 40], maxZoom: 16 });
      return;
    }

    const limites = L.latLngBounds(coordenadas);
    this.mapa.fitBounds(limites, { padding: [40, 40] });
  }

  private converterFamilia(familia: FamiliaResponse): FamiliaLocalizada | null {
    const enderecoDetalhado = familia.enderecoDetalhado;
    if (!enderecoDetalhado) {
      return null;
    }

    const { latitude, longitude } = enderecoDetalhado;
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return null;
    }

    return {
      id: familia.id,
      responsavel: this.obterResponsavel(familia),
      enderecoCompleto: this.montarEndereco(enderecoDetalhado),
      latitude,
      longitude,
      link: this.montarLinkFamilia(familia.id)
    };
  }

  private obterResponsavel(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto || 'Responsável não informado';
  }

  private montarEndereco(endereco: EnderecoFamiliaResponse): string {
    const partes = [endereco.rua, endereco.numero, endereco.bairro, `${endereco.cidade}/${endereco.uf}`]
      .filter(parte => !!parte && parte !== 'null');
    return partes.join(', ');
  }

  private montarLinkFamilia(id: number): string {
    const urlTree = this.router.createUrlTree(['/familias'], { queryParams: { familiaId: id } });
    const url = this.router.serializeUrl(urlTree);
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${url}`;
    }
    return url;
  }

  private criarConteudoPopup(familia: FamiliaLocalizada): string {
    const titulo = this.escapeHtml(`Família de ${familia.responsavel}`);
    const endereco = this.escapeHtml(familia.enderecoCompleto);
    const link = this.escapeHtml(familia.link);
    return `
      <div class="popup-conteudo">
        <strong>${titulo}</strong>
        <div class="popup-endereco">${endereco}</div>
        <a href="${link}" target="_blank" rel="noopener" class="popup-link">
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          <span>Abrir cadastro</span>
        </a>
      </div>
    `;
  }

  private criarMarcador(familia: FamiliaLocalizada): L.Marker {
    return L.marker([familia.latitude, familia.longitude], {
      icon: this.iconeFamilia
    }).bindPopup(this.criarConteudoPopup(familia));
  }

  private escapeHtml(valor: string): string {
    const mapaCaracteres: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return valor.replace(/[&<>"']/g, caractere => mapaCaracteres[caractere]);
  }

  private obterGrupoMaisDenso(): L.LatLngExpression[] | null {
    if (this.familiasLocalizadas.length <= 1) {
      return null;
    }

    const tamanhoCelula = 0.05;
    const grupos = new Map<string, FamiliaLocalizada[]>();

    this.familiasLocalizadas.forEach(familia => {
      const chaveLat = Math.round(familia.latitude / tamanhoCelula);
      const chaveLng = Math.round(familia.longitude / tamanhoCelula);
      const chave = `${chaveLat}-${chaveLng}`;
      const grupoAtual = grupos.get(chave) ?? [];
      grupoAtual.push(familia);
      grupos.set(chave, grupoAtual);
    });

    let maiorGrupo: FamiliaLocalizada[] = [];
    grupos.forEach(grupo => {
      if (grupo.length > maiorGrupo.length) {
        maiorGrupo = grupo;
      }
    });

    if (maiorGrupo.length < 2) {
      return null;
    }

    return maiorGrupo.map(familia => [familia.latitude, familia.longitude] as L.LatLngExpression);
  }
}
