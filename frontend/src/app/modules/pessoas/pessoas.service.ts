import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../shared/api-url.util';

export interface PessoaPayload {
  nome: string;
  cpf: string;
  cep?: string | null;
  rua: string;
  numero: string;
  cidadeId: number;
  bairroId?: number | null;
  novoBairro?: string | null;
  novaRegiao?: string | null;
}

export interface PessoaResposta {
  id: number;
  nome: string;
  cpf: string;
  endereco: {
    rua: string;
    numero: string;
    cep: string | null;
    bairro: string | null;
    regiao: string | null;
    cidade: string;
    uf: string;
    latitude: number | null;
    longitude: number | null;
  };
}

@Injectable({ providedIn: 'root' })
export class PessoasService {
  constructor(private readonly http: HttpClient) {}

  criarPessoa(payload: PessoaPayload): Observable<PessoaResposta> {
    return this.http.post<PessoaResposta>(buildApiUrl('/pessoas'), payload);
  }
}
