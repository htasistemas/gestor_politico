import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { buildApiUrl } from '../shared/api-url.util';
import { GrauParentesco } from './parentesco.enum';

export interface FamiliaMembroPayload {
  nomeCompleto: string;
  dataNascimento: string | null;
  profissao: string | null;
  parentesco: GrauParentesco;
  responsavelPrincipal: boolean;
  probabilidadeVoto: string;
  telefone: string | null;
}

export interface FamiliaPayload {
  cep: string | null;
  rua: string;
  numero: string;
  cidadeId: number;
  novaRegiao: string | null;
  membros: FamiliaMembroPayload[];
}

export interface EnderecoFamiliaResponse {
  id: number;
  rua: string;
  numero: string;
  cep: string | null;
  bairro: string | null;
  regiao: string | null;
  cidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
}

export interface FamiliaMembroResponse {
  id: number;
  nomeCompleto: string;
  dataNascimento: string | null;
  profissao: string | null;
  parentesco: GrauParentesco;
  responsavelPrincipal: boolean;
  probabilidadeVoto: string;
  telefone: string | null;
  criadoEm: string;
}

export interface FamiliaResponse {
  id: number;
  endereco: string;
  bairro: string;
  criadoEm: string;
  enderecoDetalhado: EnderecoFamiliaResponse;
  membros: FamiliaMembroResponse[];
}

export interface FamiliaFiltro {
  cidadeId?: number | null;
  regiao?: string | null;
  bairro?: string | null;
  responsavel?: string | null;
  probabilidadeVoto?: string | null;
  rua?: string | null;
  numero?: string | null;
  cep?: string | null;
  termo?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}

export interface FamiliaListaResponse {
  familias: FamiliaResponse[];
  total: number;
  pagina: number;
  tamanho: number;
  responsaveisAtivos: number;
  novosCadastros: number;
}

@Injectable({ providedIn: 'root' })
export class FamiliasService {
  private readonly apiUrl = buildApiUrl('familias');

  constructor(private readonly http: HttpClient) {}

  buscarFamilias(
    filtros: FamiliaFiltro = {},
    pagina = 0,
    tamanho = 20
  ): Observable<FamiliaListaResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanho', tamanho.toString());

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor === null || valor === undefined) {
        return;
      }
      const texto = typeof valor === 'string' ? valor.trim() : valor;
      if (texto === '' || texto === null) {
        return;
      }
      params = params.set(chave, String(texto));
    });

    return this.http.get<FamiliaListaResponse>(this.apiUrl, { params });
  }

  listarTodasFamilias(filtros: FamiliaFiltro = {}): Observable<FamiliaResponse[]> {
    return this.buscarFamilias(filtros, 0, 1000).pipe(map(resposta => resposta.familias));
  }

  criarFamilia(payload: FamiliaPayload): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(this.apiUrl, payload);
  }
}
