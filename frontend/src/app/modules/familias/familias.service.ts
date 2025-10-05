import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { buildApiUrl } from '../shared/api-url.util';
import { GrauParentesco } from './parentesco.enum';

export interface FamiliaMembroPayload {
  id?: number | null;
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
  parceiroToken?: string | null;
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
  parceiro: boolean;
  parceiroId: number | null;
  parceiroToken: string | null;
}

export interface FamiliaResponse {
  id: number;
  endereco: string;
  bairro: string;
  criadoEm: string;
  enderecoDetalhado: EnderecoFamiliaResponse;
  membros: FamiliaMembroResponse[];
  parceiroCadastro?: {
    id: number;
    nome: string | null;
    token: string;
  } | null;
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
  totalPessoas: number;
  novasPessoasSemana: number;
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

  obterFamilia(id: number): Observable<FamiliaResponse> {
    return this.http.get<FamiliaResponse>(`${this.apiUrl}/${id}`);
  }

  criarFamilia(payload: FamiliaPayload): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(this.apiUrl, payload);
  }

  atualizarFamilia(id: number, payload: FamiliaPayload): Observable<FamiliaResponse> {
    return this.http.put<FamiliaResponse>(`${this.apiUrl}/${id}`, payload);
  }

  tornarMembroParceiro(familiaId: number, membroId: number): Observable<FamiliaMembroResponse> {
    return this.http.post<FamiliaMembroResponse>(
      `${this.apiUrl}/${familiaId}/membros/${membroId}/parceiro`,
      {}
    );
  }
}
