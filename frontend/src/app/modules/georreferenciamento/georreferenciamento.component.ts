import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.heat';
import { Subscription } from 'rxjs';
import { FamiliasService, FamiliaResponse, EnderecoFamiliaResponse } from '../familias/familias.service';
import { NotificationService } from '../shared/services/notification.service';
interface FamiliaLocalizada {
  id: number;
  responsavel: string;
  enderecoCompleto: string;
  latitude: number;
  longitude: number;
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
  private camadaCalor: L.HeatLayer | null = null;
  private assinaturaFamilias: Subscription | null = null;
  private ajusteMapaTimeout: number | null = null;

  constructor(
    private readonly familiasService: FamiliasService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.carregarFamilias();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
    this.agendarAjusteMapa();
    this.atualizarMapa();
  }

  ngOnDestroy(): void {
    if (this.ajusteMapaTimeout !== null) {
      clearTimeout(this.ajusteMapaTimeout);
      this.ajusteMapaTimeout = null;
    }
    this.assinaturaFamilias?.unsubscribe();
    this.removerCamadaCalor();
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.agendarAjusteMapa();
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
      error: _erro => {
        this.notificationService.showError(
          'Erro ao carregar famílias',
          'Não foi possível carregar as famílias cadastradas para o mapa.'
        );
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
      detectRetina: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contribuidores'
    }).addTo(this.mapa);
  }

  private atualizarMapa(): void {
    if (!this.mapa) {
      return;
    }

    this.agendarAjusteMapa();
    if (this.familiasLocalizadas.length === 0) {
      this.removerCamadaCalor();
      return;
    }

    const coordenadas: L.LatLngExpression[] = this.familiasLocalizadas.map(familia => [
      familia.latitude,
      familia.longitude
    ]);

    this.atualizarMapaDeCalor();

    this.ajustarVisaoMapa(coordenadas);
  }

  private agendarAjusteMapa(): void {
    if (!this.mapa) {
      return;
    }

    if (this.ajusteMapaTimeout !== null) {
      clearTimeout(this.ajusteMapaTimeout);
    }

    this.ajusteMapaTimeout = setTimeout(() => {
      this.mapa?.invalidateSize();
      this.ajusteMapaTimeout = null;
    }, 0);
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
      longitude
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

  private atualizarMapaDeCalor(): void {
    if (!this.mapa) {
      return;
    }

    const pontosCalor: L.HeatLatLngTuple[] = this.familiasLocalizadas.map(familia => [familia.latitude, familia.longitude, 0.6]);

    if (!this.camadaCalor) {
      this.camadaCalor = L.heatLayer(pontosCalor, {
        radius: 28,
        blur: 18,
        maxZoom: 17,
        minOpacity: 0.35
      }).addTo(this.mapa);
      return;
    }

    this.camadaCalor.setLatLngs(pontosCalor);
  }

  private removerCamadaCalor(): void {
    if (!this.camadaCalor) {
      return;
    }

    if (this.mapa) {
      this.mapa.removeLayer(this.camadaCalor);
    }
    this.camadaCalor = null;
  }

  private ajustarVisaoMapa(coordenadas: L.LatLngExpression[]): void {
    if (!this.mapa || coordenadas.length === 0) {
      return;
    }

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
