import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
  telefoneFormatado: string | null;
  telefoneWhatsapp: string | null;
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
  private ajusteMapaTimeout: number | null = null;
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
    this.agendarAjusteMapa();
    this.atualizarMapa();
  }

  ngOnDestroy(): void {
    if (this.ajusteMapaTimeout !== null) {
      clearTimeout(this.ajusteMapaTimeout);
      this.ajusteMapaTimeout = null;
    }
    this.assinaturaFamilias?.unsubscribe();
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

    this.agendarAjusteMapa();

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
      longitude,
      link: this.montarLinkFamilia(familia.id),
      ...this.processarTelefone(this.obterTelefoneResponsavel(familia))
    };
  }

  private obterResponsavel(familia: FamiliaResponse): string {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.nomeCompleto || 'Responsável não informado';
  }

  private obterTelefoneResponsavel(familia: FamiliaResponse): string | null {
    const responsavel = familia.membros.find(membro => membro.responsavelPrincipal);
    return responsavel?.telefone ?? null;
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
    const telefone = familia.telefoneFormatado ? this.escapeHtml(familia.telefoneFormatado) : null;
    const telefoneHtml = telefone
      ? `
        <div class="popup-telefone">
          <span class="popup-telefone__label">Telefone</span>
          <span class="popup-telefone__numero">${telefone}</span>
        </div>
      `
      : `
        <div class="popup-telefone popup-telefone--ausente">
          <span class="popup-telefone__label">Telefone</span>
          <span class="popup-telefone__numero">Não informado</span>
        </div>
      `;
    const whatsappBotao = familia.telefoneWhatsapp
      ? `
        <button type="button" class="popup-whatsapp" data-telefone="${this.escapeHtml(familia.telefoneWhatsapp)}">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
          <span class="popup-whatsapp__texto">Abrir WhatsApp</span>
          <span class="popup-whatsapp__loading is-hidden">Abrindo...</span>
        </button>
      `
      : '';
    return `
      <div class="popup-conteudo">
        <strong>${titulo}</strong>
        <div class="popup-endereco">${endereco}</div>
        ${telefoneHtml}
        <a href="${link}" target="_blank" rel="noopener" class="popup-link">
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          <span>Abrir cadastro</span>
        </a>
        ${whatsappBotao}
      </div>
    `;
  }

  private criarMarcador(familia: FamiliaLocalizada): L.Marker {
    const marcador = L.marker([familia.latitude, familia.longitude], {
      icon: this.iconeFamilia
    }).bindPopup(this.criarConteudoPopup(familia));
    marcador.on('popupopen', evento => {
      const elementoPopup = (evento.popup.getElement?.() as HTMLElement | undefined) ?? null;
      this.configurarInteracoesPopup(elementoPopup);
    });
    return marcador;
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

  private processarTelefone(telefone: string | null): { telefoneFormatado: string | null; telefoneWhatsapp: string | null } {
    if (!telefone) {
      return { telefoneFormatado: null, telefoneWhatsapp: null };
    }

    const digitosOriginais = telefone.replace(/\D/g, '');
    if (!digitosOriginais) {
      return { telefoneFormatado: telefone.trim() || null, telefoneWhatsapp: null };
    }

    let digitosParaFormatar = digitosOriginais;
    if (digitosParaFormatar.startsWith('55') && (digitosParaFormatar.length === 12 || digitosParaFormatar.length === 13)) {
      digitosParaFormatar = digitosParaFormatar.slice(2);
    }

    let telefoneFormatado: string | null = null;
    let telefoneWhatsapp: string | null = null;

    if (digitosParaFormatar.length === 11) {
      telefoneFormatado = `(${digitosParaFormatar.slice(0, 2)}) ${digitosParaFormatar.slice(2, 7)}-${digitosParaFormatar.slice(7)}`;
      telefoneWhatsapp = `55${digitosParaFormatar}`;
    } else if (digitosParaFormatar.length === 10) {
      telefoneFormatado = `(${digitosParaFormatar.slice(0, 2)}) ${digitosParaFormatar.slice(2, 6)}-${digitosParaFormatar.slice(6)}`;
      telefoneWhatsapp = `55${digitosParaFormatar}`;
    } else {
      telefoneFormatado = telefone.trim() || null;
    }

    return {
      telefoneFormatado,
      telefoneWhatsapp
    };
  }

  private configurarInteracoesPopup(elemento: HTMLElement | null): void {
    if (!elemento || typeof window === 'undefined') {
      return;
    }

    const botaoWhatsapp = elemento.querySelector<HTMLButtonElement>('.popup-whatsapp');
    if (!botaoWhatsapp || botaoWhatsapp.dataset.listenerRegistrado === 'true') {
      return;
    }

    botaoWhatsapp.dataset.listenerRegistrado = 'true';
    botaoWhatsapp.addEventListener('click', () => {
      const telefone = botaoWhatsapp.dataset.telefone;
      if (!telefone) {
        return;
      }

      const textoPadrao = botaoWhatsapp.querySelector<HTMLElement>('.popup-whatsapp__texto');
      const textoLoading = botaoWhatsapp.querySelector<HTMLElement>('.popup-whatsapp__loading');

      botaoWhatsapp.disabled = true;
      textoPadrao?.classList.add('is-hidden');
      textoLoading?.classList.remove('is-hidden');

      try {
        const url = `https://wa.me/${telefone}`;
        window.open(url, '_blank', 'noopener');
      } finally {
        setTimeout(() => {
          textoPadrao?.classList.remove('is-hidden');
          textoLoading?.classList.add('is-hidden');
          botaoWhatsapp.disabled = false;
        }, 500);
      }
    });
  }
}
