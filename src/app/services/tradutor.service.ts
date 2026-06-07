import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TradutorService {
  private http = inject(HttpClient);

  traduzir(texto: string, idiomaDestino: string): Observable<string> {
    const url = `/google-api/translate_a/t?client=dict-chrome-ex&sl=pt&tl=${idiomaDestino}&q=${encodeURIComponent(texto)}`;
    
    return this.http.get<any[]>(url).pipe(
      map(resposta => {
        if (Array.isArray(resposta) && resposta.length > 0) {
          return resposta[0];
        }
        throw new Error('Formato de resposta inválido da API de tradução.');
      }),
      catchError(this.tratarErro)
    );
  }

  private tratarErro(erro: HttpErrorResponse): Observable<never> {
    let mensagemErro = 'Ocorreu um erro desconhecido.';
    if (erro.error instanceof ErrorEvent) {
      mensagemErro = `Erro do cliente: ${erro.error.message}`;
    } else {
      mensagemErro = `Código do erro retornado pelo servidor: ${erro.status}, mensagem: ${erro.message}`;
    }
    return throwError(() => new Error(mensagemErro));
  }
}
