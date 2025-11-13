import nodemailer from 'nodemailer';
import { PriceData } from './types';

/**
 * Sistema de notificações por email
 */
export class Notifier {
  private transporter: nodemailer.Transporter | null = null;
  private notifiedPrices = new Set<string>(); // Evita spam

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Inicializa o transportador SMTP
   */
  private initializeTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
      console.warn('[Notifier] Configurações de email não encontradas. Notificações desabilitadas.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      console.log('[Notifier] Transportador SMTP inicializado com sucesso');
    } catch (error) {
      console.error('[Notifier] Erro ao inicializar transportador:', error);
    }
  }

  /**
   * Verifica se deve notificar sobre um preço
   */
  private shouldNotify(priceData: PriceData, targetPrice: number): boolean {
    if (!priceData.price || !priceData.available) {
      return false;
    }

    if (priceData.price > targetPrice) {
      return false;
    }

    // Cria chave única para este preço
    const key = `${priceData.productId}-${priceData.store}-${priceData.price}`;

    // Já notificou sobre este preço?
    if (this.notifiedPrices.has(key)) {
      return false;
    }

    return true;
  }

  /**
   * Envia notificação por email
   */
  async notify(priceData: PriceData, targetPrice: number): Promise<void> {
    if (!this.transporter) {
      console.log('[Notifier] Email não configurado. Pulando notificação.');
      return;
    }

    if (!this.shouldNotify(priceData, targetPrice)) {
      return;
    }

    const key = `${priceData.productId}-${priceData.store}-${priceData.price}`;

    try {
      const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `🎯 ALERTA DE PREÇO: ${priceData.productName}`,
        html: this.generateEmailHTML(priceData, targetPrice),
      };

      await this.transporter.sendMail(mailOptions);

      // Marca como notificado
      this.notifiedPrices.add(key);

      console.log(`[Notifier] Email enviado para ${to}: ${priceData.productName} por R$ ${priceData.price}`);
    } catch (error) {
      console.error('[Notifier] Erro ao enviar email:', error);
    }
  }

  /**
   * Gera HTML do email
   */
  private generateEmailHTML(priceData: PriceData, targetPrice: number): string {
    const savings = targetPrice - (priceData.price || 0);
    const discount = ((savings / targetPrice) * 100).toFixed(1);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .price {
            font-size: 48px;
            font-weight: bold;
            color: #22c55e;
            text-align: center;
            margin: 20px 0;
          }
          .store {
            text-align: center;
            font-size: 20px;
            color: #666;
            margin-bottom: 20px;
          }
          .savings {
            background: #dcfce7;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 ALERTA DE PREÇO!</h1>
            <p>O produto que você está monitorando atingiu seu preço-alvo!</p>
          </div>
          <div class="content">
            <h2>${priceData.productName}</h2>
            <div class="store">${priceData.storeName}</div>
            <div class="price">R$ ${priceData.price?.toFixed(2).replace('.', ',')}</div>
            <div class="savings">
              <strong>💰 Economia: R$ ${savings.toFixed(2).replace('.', ',')} (${discount}% abaixo do seu alvo)</strong><br>
              Seu preço-alvo: R$ ${targetPrice.toFixed(2).replace('.', ',')}
            </div>
            <div style="text-align: center;">
              <a href="${priceData.url}" class="button">VER PRODUTO 🛒</a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              ⏰ Preço capturado em: ${new Date(priceData.timestamp).toLocaleString('pt-BR')}
            </p>
            <p style="color: #ef4444; font-size: 14px;">
              ⚡ Aproveite rápido! Os preços podem mudar a qualquer momento.
            </p>
          </div>
          <div class="footer">
            <p>Este é um alerta automático do seu monitor de preços.</p>
            <p>Black Friday 2025 - Monitoramento de Preços</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Limpa o cache de notificações (útil para testes)
   */
  clearNotificationCache() {
    this.notifiedPrices.clear();
  }
}

// Instância singleton
let notifierInstance: Notifier | null = null;

export function getNotifier(): Notifier {
  if (!notifierInstance) {
    notifierInstance = new Notifier();
  }
  return notifierInstance;
}
