import { PriceData } from './types';

/**
 * Sistema de notificações via ntfy.sh
 * Envia notificações push para seu celular instantaneamente!
 *
 * Setup:
 * 1. Instale o app ntfy no celular: https://ntfy.sh/app
 * 2. Escolha um tópico único (ex: price-monitor-seu-nome-123)
 * 3. Inscreva-se no tópico no app
 * 4. Configure NTFY_TOPIC no .env.local
 */
export class NtfyNotifier {
  private server: string;
  private topic: string;
  private notifiedPrices = new Set<string>();

  constructor() {
    this.server = process.env.NTFY_SERVER || 'https://ntfy.sh';
    this.topic = process.env.NTFY_TOPIC || '';

    if (!this.topic) {
      console.warn('[ntfy] NTFY_TOPIC não configurado. Notificações desabilitadas.');
      console.warn('[ntfy] Configure NTFY_TOPIC no .env.local');
    } else {
      console.log(`[ntfy] Notificações habilitadas: ${this.server}/${this.topic}`);
    }
  }

  /**
   * Verifica se deve notificar
   */
  private shouldNotify(priceData: PriceData, targetPrice: number): boolean {
    if (!this.topic) return false;
    if (!priceData.price || !priceData.available) return false;
    if (priceData.price > targetPrice) return false;

    const key = `${priceData.productId}-${priceData.store}-${priceData.price}`;
    if (this.notifiedPrices.has(key)) return false;

    return true;
  }

  /**
   * Envia notificação via ntfy
   */
  async notify(priceData: PriceData, targetPrice: number): Promise<void> {
    if (!this.shouldNotify(priceData, targetPrice)) {
      return;
    }

    const key = `${priceData.productId}-${priceData.store}-${priceData.price}`;

    try {
      const savings = targetPrice - (priceData.price || 0);
      const discount = ((savings / targetPrice) * 100).toFixed(1);

      const message = `${priceData.productName}\n${priceData.storeName}\n\nR$ ${priceData.price?.toFixed(2).replace('.', ',')}\n\nEconomia: R$ ${savings.toFixed(2).replace('.', ',')} (${discount}% abaixo)`;

      const response = await fetch(`${this.server}/${this.topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Title': 'ALERTA DE PRECO!',
          'Priority': 'high',
          'Tags': 'moneybag,bell',
          'Actions': `view, Ver Produto, ${priceData.url}`,
        },
        body: `${message}`,
      });

      if (response.ok) {
        this.notifiedPrices.add(key);
        console.log(`[ntfy] Notificação enviada: ${priceData.productName} por R$ ${priceData.price}`);
      } else {
        console.error(`[ntfy] Erro ao enviar: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[ntfy] Erro ao enviar notificação:', error);
    }
  }

  /**
   * Envia notificação de teste
   */
  async sendTest(): Promise<boolean> {
    if (!this.topic) {
      console.error('[ntfy] NTFY_TOPIC não configurado!');
      return false;
    }

    try {
      const response = await fetch(`${this.server}/${this.topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Title': 'ntfy Configurado!',
          'Priority': 'default',
          'Tags': 'white_check_mark',
        },
        body: '✅ Monitor de Preços está pronto para enviar alertas!\n\nVocê receberá notificações quando os preços atingirem suas metas.',
      });

      if (response.ok) {
        console.log('[ntfy] Mensagem de teste enviada com sucesso!');
        return true;
      } else {
        console.error(`[ntfy] Erro: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('[ntfy] Erro ao enviar teste:', error);
      return false;
    }
  }

  /**
   * Envia summary de todos os preços (após cada rodada)
   */
  async sendSummary(prices: PriceData[], targetPrices: Map<string, number>): Promise<void> {
    if (!this.topic) return;

    try {
      let message = '📊 RESUMO DE PRECOS\n\n';

      // Agrupa por produto
      const byProduct = new Map<string, PriceData[]>();
      prices.forEach(p => {
        if (!byProduct.has(p.productId)) {
          byProduct.set(p.productId, []);
        }
        byProduct.get(p.productId)!.push(p);
      });

      // Para cada produto
      byProduct.forEach((productPrices, productId) => {
        const productName = productPrices[0].productName;
        const targetPrice = targetPrices.get(productId) || 0;

        message += `${productName}\n`;
        message += `Meta: R$ ${targetPrice.toFixed(2).replace('.', ',')}\n\n`;

        // Para cada loja
        productPrices.forEach(p => {
          if (p.price === null || !p.available) {
            message += `❌ ${p.storeName}: Nao encontrado\n`;
          } else if (p.price <= targetPrice) {
            const savings = targetPrice - p.price;
            message += `🎯 ${p.storeName}: R$ ${p.price.toFixed(2).replace('.', ',')} (BOM PRECO! -R$ ${savings.toFixed(2).replace('.', ',')})\n`;
          } else {
            const diff = p.price - targetPrice;
            message += `⚠️ ${p.storeName}: R$ ${p.price.toFixed(2).replace('.', ',')} (+R$ ${diff.toFixed(2).replace('.', ',')})\n`;
          }
        });

        message += '\n';
      });

      message += `\n⏰ ${new Date().toLocaleString('pt-BR')}\n`;
      message += '🔗 Abra o app para ver os links';

      const response = await fetch(`${this.server}/${this.topic}`, {
        method: 'POST',
        headers: {
          'Title': 'Resumo de Precos',
          'Priority': 'default',
          'Tags': 'chart_with_upwards_trend',
        },
        body: message,
      });

      if (response.ok) {
        console.log('[ntfy] Summary enviado com sucesso');
      } else {
        console.error(`[ntfy] Erro ao enviar summary: ${response.status}`);
      }
    } catch (error) {
      console.error('[ntfy] Erro ao enviar summary:', error);
    }
  }

  /**
   * Limpa cache de notificações
   */
  clearCache() {
    this.notifiedPrices.clear();
  }
}

// Singleton
let ntfyInstance: NtfyNotifier | null = null;

export function getNtfyNotifier(): NtfyNotifier {
  if (!ntfyInstance) {
    ntfyInstance = new NtfyNotifier();
  }
  return ntfyInstance;
}
