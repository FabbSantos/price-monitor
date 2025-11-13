# 🎯 Guia de Uso - Cenários Práticos

## Cenário 1: Quero Apenas Testar (5 min)

```bash
# 1. Instale
npm install

# 2. Configure (rápido)
node scripts/setup.js

# 3. Rode
npm run dev
```

**Resultado**: Interface abre em http://localhost:3000

**Como usar**:
- Clique no botão **"Atualizar"** quando quiser checar preços
- Os preços aparecem nos cards
- Se atingir o alvo, o card fica verde e pisca

**Limitação**: Precisa clicar manualmente. Não monitora sozinho.

---

## Cenário 2: Quero Monitorar Hoje (Trabalho/Estudo)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker
```

**Ou tudo junto**:
```bash
npm run dev:full
```

**Resultado**:
- ✅ Interface disponível em http://localhost:3000
- ✅ Worker roda em background
- ✅ A cada 30 min faz scraping automático
- ✅ Você recebe email se atingir o alvo

**Terminal 2 mostra**:
```
🤖 Worker de Monitoramento Iniciado

[13/11/2025 10:00:00] 🔍 Iniciando scraping...
✅ Scraping concluído em 12500ms
📊 8 preços coletados

🎯 ALERTAS:
   - TCL C755 65" em Amazon BR: R$ 3899.99

⏳ Próxima checagem em 30 minutos...
```

**Limitação**: Se você **desligar o PC** ou **fechar o terminal**, para de monitorar.

---

## Cenário 3: Quero Monitorar 24/7 (Black Friday)

### Opção A: Deixar PC ligado

```bash
# Instale PM2 (gerenciador de processos)
npm install -g pm2

# Inicie o servidor Next.js
pm2 start npm --name "price-monitor-server" -- run dev

# Inicie o worker
pm2 start worker.js --name "price-monitor-worker"

# Veja status
pm2 status

# Veja logs em tempo real
pm2 logs
```

**Resultado**:
- ✅ Roda mesmo se você fechar o terminal
- ✅ Reinicia automaticamente se crashar
- ✅ Roda em background 24/7
- ✅ Pode fechar o browser

**Para parar**:
```bash
pm2 stop all
pm2 delete all
```

### Opção B: Deploy na nuvem (MELHOR)

```bash
# 1. Instale CLI da Vercel
npm install -g vercel

# 2. Faça login
vercel login

# 3. Deploy
vercel --prod

# 4. Configure variáveis de ambiente no painel
# https://vercel.com/seu-usuario/price-monitor/settings/environment-variables
```

**Resultado**:
- ✅ Roda 24/7 na nuvem da Vercel
- ✅ Grátis até 100 invocações/dia
- ✅ Não precisa deixar PC ligado
- ✅ Cron job automático a cada 30 min
- ✅ Interface acessível de qualquer lugar

**Acessar**: https://seu-projeto.vercel.app

---

## Cenário 4: Quero Receber Notificações no Celular

### Telegram (em vez de email)

Crie um bot no Telegram e modifique o notifier:

```bash
npm install node-telegram-bot-api
```

```typescript
// src/lib/notifier-telegram.ts
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: false });

export async function notifyTelegram(priceData: PriceData) {
  await bot.sendMessage(
    process.env.TELEGRAM_CHAT_ID!,
    `🎯 *ALERTA DE PREÇO*\n\n${priceData.productName}\n${priceData.storeName}\n\nR$ ${priceData.price}\n\n[Ver Produto](${priceData.url})`,
    { parse_mode: 'Markdown' }
  );
}
```

### WhatsApp (via Twilio)

```bash
npm install twilio
```

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: `🎯 ${priceData.productName} por R$ ${priceData.price}!`,
  from: 'whatsapp:+14155238886',
  to: `whatsapp:${process.env.YOUR_WHATSAPP}`
});
```

---

## Cenário 5: Quero Monitorar Vários Produtos

### Adicione em `config/products.json`:

```json
{
  "products": [
    {
      "id": "tv-1",
      "name": "TCL C755 65\"",
      "targetPrice": 4000,
      "urls": { ... }
    },
    {
      "id": "tv-2",
      "name": "Samsung 65\"",
      "targetPrice": 3500,
      "urls": { ... }
    },
    {
      "id": "soundbar-1",
      "name": "Soundbar JBL",
      "targetPrice": 800,
      "urls": { ... }
    }
  ]
}
```

**Resultado**: Todos os produtos aparecem na interface!

---

## Cenário 6: Quero Compartilhar com Amigos

### Deploy na Vercel e compartilhe o link:

```bash
vercel --prod
```

**Resultado**: https://price-monitor-xxx.vercel.app

Seus amigos podem:
- ✅ Ver os preços em tempo real
- ✅ Ver o histórico
- ✅ Clicar para ir às lojas
- ❌ Não podem adicionar produtos (você controla isso)

**Para proteger com senha**:

Adicione em `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const auth = request.headers.get('authorization');

  if (auth !== 'Bearer sua-senha-secreta') {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic' }
    });
  }
}
```

---

## Cenário 7: Quero Exportar Histórico

### Para Excel/CSV:

```bash
# Instale biblioteca
npm install xlsx

# Crie script
node scripts/export-excel.js
```

```javascript
// scripts/export-excel.js
const XLSX = require('xlsx');
const fs = require('fs');

const history = JSON.parse(fs.readFileSync('data/prices-history.json'));

const data = [];
history.forEach(entry => {
  entry.prices.forEach(price => {
    data.push({
      Produto: entry.productId,
      Loja: entry.store,
      Preço: price.price,
      Data: new Date(price.timestamp).toLocaleString('pt-BR')
    });
  });
});

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Preços');
XLSX.writeFile(wb, 'precos-historico.xlsx');

console.log('✅ Exportado para precos-historico.xlsx');
```

---

## Cenário 8: Uma Loja Mudou o Site (Scraper Quebrou)

### Atualize o scraper:

1. **Acesse a URL do produto** manualmente
2. **Inspecione o HTML** (F12 → Elements)
3. **Encontre o elemento do preço**
4. **Copie a classe/ID**
5. **Atualize o scraper**:

```typescript
// src/lib/scrapers/amazon.ts
const priceSelectors = [
  '.novo-seletor-aqui',  // ← Adicione aqui
  '.a-price-whole',
  '#priceblock_ourprice',
  // ...
];
```

6. **Teste**:
```bash
npm run test:scraper
```

---

## Cenário 9: Quero Adicionar Nova Loja (Shopee)

### 1. Crie o scraper:

```typescript
// src/lib/scrapers/shopee.ts
import { BaseScraper } from './base';
import * as cheerio from 'cheerio';

export class ShopeeScraper extends BaseScraper {
  async scrape(url: string) {
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    const price = this.extractPrice($('.price-selector').text());
    const outOfStock = $('.out-of-stock').length > 0;

    return {
      price,
      available: !outOfStock && price !== null,
    };
  }
}
```

### 2. Registre no factory:

```typescript
// src/lib/scrapers/index.ts
import { ShopeeScraper } from './shopee';

export function getScraperForStore(storeId: string) {
  switch (storeId) {
    case 'shopee':
      return new ShopeeScraper();
    // ...
  }
}
```

### 3. Adicione no config:

```json
// config/products.json
{
  "stores": [
    {
      "id": "shopee",
      "name": "Shopee",
      "enabled": true
    }
  ]
}
```

### 4. Adicione URLs dos produtos:

```json
{
  "products": [
    {
      "urls": {
        "shopee": "https://shopee.com.br/produto-xxx"
      }
    }
  ]
}
```

**Pronto!** A Shopee aparece automaticamente na interface.

---

## Cenário 10: Troubleshooting

### Problema: "Preço não encontrado"

**Causa**: Seletores CSS desatualizados

**Solução**:
```bash
# 1. Teste manualmente
npm run test:scraper

# 2. Veja o output e identifique quais seletores funcionam

# 3. Atualize o scraper correspondente
```

### Problema: "Worker não conecta"

**Causa**: Servidor não está rodando

**Solução**:
```bash
# Terminal 1 - SEMPRE inicie o servidor primeiro
npm run dev

# Aguarde aparecer "ready - started server"

# Terminal 2 - Só então inicie o worker
npm run worker
```

### Problema: "Email não chega"

**Causa**: Senha incorreta ou bloqueio do Gmail

**Solução**:
```bash
# 1. Use senha de APP (não a senha normal!)
# https://myaccount.google.com/apppasswords

# 2. Teste
npm run test:email

# 3. Verifique spam/lixo eletrônico
```

### Problema: "Vercel timeout"

**Causa**: Scraping muito demorado (>10s no plano free)

**Solução**:
1. Reduza número de lojas/produtos
2. Upgrade para Vercel Pro (60s timeout)
3. Use serviço externo (cron-job.org)

---

## Atalhos Úteis

```bash
# Setup inicial
npm run setup

# Testar email
npm run test:email

# Testar scrapers
npm run test:scraper

# Rodar completo (servidor + worker)
npm run dev:full

# Ver logs do PM2
pm2 logs

# Parar tudo
pm2 stop all
```

---

## 🎓 Resumo Rápido

| Quero... | Comando |
|----------|---------|
| Apenas testar | `npm run dev` |
| Monitorar hoje | `npm run dev:full` |
| Monitorar 24/7 local | `pm2 start worker.js` |
| Monitorar 24/7 nuvem | `vercel --prod` |
| Testar email | `npm run test:email` |
| Adicionar produto | Editar `config/products.json` |
| Adicionar loja | Criar scraper + config |
| Ver histórico | Abrir `data/prices-history.json` |
| Exportar dados | `node scripts/export-excel.js` |

---

**Dúvidas?** Consulte:
- [README.md](README.md) - Documentação completa
- [MONITORING_OPTIONS.md](MONITORING_OPTIONS.md) - Opções de monitoramento
- [ARCHITECTURE.md](ARCHITECTURE.md) - Como funciona internamente
- [API_EXAMPLES.md](API_EXAMPLES.md) - Integração com outros sistemas

Boa caçada de ofertas! 🎯🛍️
