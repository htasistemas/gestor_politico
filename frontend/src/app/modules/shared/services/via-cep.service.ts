import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ViaCepService {
  private readonly baseUrl = 'https://viacep.com.br/ws';

  constructor(private readonly http: HttpClient) {}

  buscarCep(cep: string): Observable<ViaCepResponse | null> {
    const sanitized = cep.replace(/\D/g, '');
    if (!sanitized) {
      return of(null);
    }

    return this.http.get<ViaCepResponse>(`${this.baseUrl}/${sanitized}/json`).pipe(
      map(resposta => (resposta.erro ? null : resposta))
    );
  }
}
