import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradutorService } from '../../services/tradutor.service';
import { forkJoin, map } from 'rxjs';

@Component({
    selector: 'app-tradutor',
    imports: [CommonModule, FormsModule],
    templateUrl: './tradutor.component.html',
    styleUrls: ['./tradutor.component.css']
})
export class TradutorComponent {
  private tradutorService = inject(TradutorService);

  textoOrigem = '';
  textoIngles = '';
  textoEspanhol = '';
  estaCarregando = false;
  mensagemErro = '';
  mensagemSucesso = '';
  areaCopiada: 'en' | 'es' | null = null;

  limpar(): void {
    this.textoOrigem = '';
    this.textoIngles = '';
    this.textoEspanhol = '';
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.areaCopiada = null;
  }

  traduzirTexto(): void {
    if (!this.textoOrigem.trim()) {
      return;
    }

    this.iniciarEstadoCarregamento();

    const parsing = this.extrairTextos(this.textoOrigem);

    forkJoin({
      ingles: this.tradutorService.traduzir(parsing.textoUnificado, 'en').pipe(
        map(res => this.reconstruirTexto(res, parsing.itens))
      ),
      espanhol: this.tradutorService.traduzir(parsing.textoUnificado, 'es').pipe(
        map(res => this.reconstruirTexto(res, parsing.itens))
      )
    }).subscribe({
      next: (resultados) => this.processarSucesso(resultados),
      error: (erro: Error) => this.processarErro(erro)
    });
  }

  private extrairTextos(textoCompleto: string) {
    const linhas = textoCompleto.split('\n');
    const itens: { prefixo: string, aspas: string, sufixo: string, ehFormatado: boolean, textoOriginal: string }[] = [];
    let textoUnificado = '';
    
    const regex = /^(\s*[^:]+:\s*)(['"])(.*?)\2(.*)$/;

    linhas.forEach((linha) => {
      const match = linha.match(regex);
      if (match) {
        itens.push({
          prefixo: match[1],
          aspas: match[2],
          sufixo: match[4],
          ehFormatado: true,
          textoOriginal: match[3]
        });
        textoUnificado += match[3] + '\n';
      } else {
        itens.push({
          prefixo: '',
          aspas: '',
          sufixo: '',
          ehFormatado: false,
          textoOriginal: linha
        });
        textoUnificado += linha + '\n';
      }
    });

    return {
      itens,
      textoUnificado: textoUnificado.slice(0, -1)
    };
  }

  private reconstruirTexto(traducaoBruta: string, itens: any[]): string {
    const linhasTraduzidas = traducaoBruta.split('\n');
    return itens.map((item, i) => {
      let traduzido = linhasTraduzidas[i] !== undefined ? linhasTraduzidas[i] : '';
      
      const originalTrimmed = item.textoOriginal ? item.textoOriginal.trimStart() : '';
      const originalLimpo = item.textoOriginal ? item.textoOriginal.trim() : '';
      const traduzidoTrimmed = traduzido.trimStart();
      
      const ignorarTraducao = originalLimpo.length === 1 || /^[A-Za-z]\/[A-Za-z]$/.test(originalLimpo);

      if (ignorarTraducao) {
        traduzido = item.textoOriginal;
      } else if (originalTrimmed.length > 0 && traduzidoTrimmed.length > 0) {
        const charInicial = originalTrimmed.charAt(0);
        const charTraduzido = traduzidoTrimmed.charAt(0);
        const espacosIniciais = traduzido.slice(0, traduzido.length - traduzidoTrimmed.length);
        
        if (charInicial === charInicial.toUpperCase() && charInicial !== charInicial.toLowerCase()) {
          traduzido = espacosIniciais + charTraduzido.toUpperCase() + traduzidoTrimmed.slice(1);
        } else if (charInicial === charInicial.toLowerCase() && charInicial !== charInicial.toUpperCase()) {
          traduzido = espacosIniciais + charTraduzido.toLowerCase() + traduzidoTrimmed.slice(1);
        }
      }

      if (item.ehFormatado) {
        return `${item.prefixo}${item.aspas}${traduzido}${item.aspas}${item.sufixo}`;
      }
      return traduzido;
    }).join('\n');
  }

  private iniciarEstadoCarregamento(): void {
    this.estaCarregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.areaCopiada = null;
    this.textoIngles = '';
    this.textoEspanhol = '';
  }

  private processarSucesso(resultados: { ingles: string; espanhol: string }): void {
    this.textoIngles = resultados.ingles;
    this.textoEspanhol = resultados.espanhol;
    this.estaCarregando = false;
  }

  private processarErro(erro: Error): void {
    this.mensagemErro = erro.message;
    this.estaCarregando = false;
  }

  async copiarTexto(texto: string, idioma: 'en' | 'es'): Promise<void> {
    if (!texto) {
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      this.exibirMensagemSucesso(idioma);
    } catch (erro) {
      this.mensagemErro = 'Falha ao copiar o texto para a área de transferência.';
    }
  }

  private exibirMensagemSucesso(idioma: 'en' | 'es'): void {
    this.mensagemSucesso = 'Texto copiado com sucesso!';
    this.areaCopiada = idioma;
    setTimeout(() => {
      this.mensagemSucesso = '';
      this.areaCopiada = null;
    }, 2500);
  }
}
