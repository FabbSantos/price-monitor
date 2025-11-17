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
   * Envia summary COMPACTO de todos os preços (toda execução do cron)
   */
  async sendSummary(prices: PriceData[], targetPrices: Map<string, number>): Promise<void> {
    if (!this.topic) return;

    try {
      // Agrupa por produto
      const byProduct = new Map<string, PriceData[]>();
      prices.forEach(p => {
        if (!byProduct.has(p.productId)) {
          byProduct.set(p.productId, []);
        }
        byProduct.get(p.productId)!.push(p);
      });

      // Estatísticas
      let productsOnTarget = 0;
      let productsNearTarget = 0; // até 10% acima
      let productsAboveTarget = 0;
      let unavailableCount = 0;
      const errorStores = new Set<string>();

      let message = `📊 RESUMO - ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

      // Detalhes por produto
      const productDetails: string[] = [];

      byProduct.forEach((productPrices, productId) => {
        const productName = productPrices[0].productName;
        const targetPrice = targetPrices.get(productId) || 0;

        // Encontra melhor preço disponível
        const availablePrices = productPrices.filter(p => p.price !== null && p.available);

        if (availablePrices.length === 0) {
          unavailableCount++;
          productDetails.push(`❌ ${productName}\n   Nenhuma loja disponível\n`);

          // Registra lojas com erro
          productPrices.forEach(p => {
            if (p.error) errorStores.add(p.storeName);
          });
          return;
        }

        const bestPrice = availablePrices.reduce((min, p) =>
          (p.price! < min.price!) ? p : min
        );

        const diff = bestPrice.price! - targetPrice;
        const diffPercent = (diff / targetPrice) * 100;

        if (diff <= 0) {
          // NO ALVO!
          productsOnTarget++;
          const savings = Math.abs(diff);
          productDetails.push(
            `🎯 ${productName}\n` +
            `   R$ ${bestPrice.price!.toFixed(2).replace('.', ',')} (${bestPrice.storeName}) ← NO ALVO!\n` +
            `   Economia: R$ ${savings.toFixed(2).replace('.', ',')}\n`
          );
        } else if (diffPercent <= 10) {
          // PRÓXIMO do alvo (até 10% acima)
          productsNearTarget++;
          productDetails.push(
            `⚡ ${productName}\n` +
            `   R$ ${bestPrice.price!.toFixed(2).replace('.', ',')} (${bestPrice.storeName})\n` +
            `   Meta: R$ ${targetPrice.toFixed(2).replace('.', ',')} (+${diffPercent.toFixed(1)}%)\n`
          );
        } else {
          // Acima do alvo
          productsAboveTarget++;
          productDetails.push(
            `⚠️ ${productName}\n` +
            `   R$ ${bestPrice.price!.toFixed(2).replace('.', ',')} (${bestPrice.storeName})\n` +
            `   Meta: R$ ${targetPrice.toFixed(2).replace('.', ',')} (+${diffPercent.toFixed(0)}%)\n`
          );
        }

        // Registra lojas com erro
        productPrices.forEach(p => {
          if (p.error) errorStores.add(p.storeName);
        });
      });

      // Header com estatísticas
      message += `✅ ${byProduct.size} produtos monitorados\n`;
      if (productsOnTarget > 0) message += `🎯 ${productsOnTarget} no alvo!\n`;
      if (productsNearTarget > 0) message += `⚡ ${productsNearTarget} próximo${productsNearTarget > 1 ? 's' : ''}\n`;
      if (productsAboveTarget > 0) message += `⚠️ ${productsAboveTarget} acima\n`;
      if (unavailableCount > 0) message += `❌ ${unavailableCount} indisponível${unavailableCount > 1 ? 'is' : ''}\n`;
      message += '\n';

      // Adiciona detalhes dos produtos
      message += productDetails.join('\n');

      // Lojas com erro (no final)
      if (errorStores.size > 0) {
        message += `\n🚫 Lojas bloqueadas: ${Array.from(errorStores).join(', ')}\n`;
      }

      const response = await fetch(`${this.server}/${this.topic}`, {
        method: 'POST',
        headers: {
          'Title': productsOnTarget > 0 ? '🎯 Alvo Atingido!' : 'Resumo de Preços',
          'Priority': productsOnTarget > 0 ? 'high' : 'default',
          'Tags': productsOnTarget > 0 ? 'moneybag,tada' : 'chart_with_upwards_trend',
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
