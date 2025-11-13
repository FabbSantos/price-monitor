# 📊 Monitor de Preços - Black Friday 2025

Sistema completo de monitoramento de preços para TVs TCL, desenvolvido com **Next.js 14**, **TypeScript** e **Tailwind CSS**. Interface moderna com atualização automática e notificações por email.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## 🚀 **[COMECE AQUI →](START_HERE.md)** ← Primeira vez? Leia isso primeiro!

## ✨ Funcionalidades

- 🔍 **Scraping automático** a cada 30 minutos (configurável)
- 🏪 **Múltiplas lojas**: Amazon BR, Casas Bahia, Magazine Luiza, Mercado Livre
- 📈 **Gráficos de histórico** de preços com Recharts
- 🎯 **Alertas visuais** quando o preço atinge o alvo (animação piscante)
- 📧 **Notificações por email** automáticas via SMTP
- 💾 **Histórico persistente** em JSON
- 🎨 **Interface moderna** com Glassmorphism e gradientes
- ⚡ **Atualização em tempo real** sem refresh manual
- 📱 **Responsivo** para desktop e mobile
- 🔄 **Retry automático** com backoff exponencial
- 🛡️ **Tratamento de erros** robusto

## 🚀 Quick Start

### 1. Instalação

```bash
# Clone o repositório ou navegue até a pasta
cd price-monitor

# Instale as dependências
npm install
```

### 2. Configuração

Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Copie o exemplo
cp .env.example .env.local
```

Edite o `.env.local` com suas configurações:

```env
# Configurações de Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_TO=destinatario@gmail.com

# Intervalo de checagem (em minutos)
CHECK_INTERVAL=30
```

#### 📧 Configurando Email (Gmail)

Para usar o Gmail como servidor SMTP:

1. Acesse [Google Account Security](https://myaccount.google.com/security)
2. Ative a "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Gere uma senha para "Mail" e "Windows Computer"
5. Use essa senha no campo `EMAIL_PASS`

> **Nota**: Nunca use sua senha normal do Gmail! Sempre use uma senha de app.

### 3. Configurar Produtos

Edite o arquivo `config/products.json` para adicionar URLs reais dos produtos:

```json
{
  "products": [
    {
      "id": "tcl-c755-65",
      "name": "TCL C755 65\"",
      "targetPrice": 4000,
      "urls": {
        "amazon": "https://www.amazon.com.br/dp/XXXXX",
        "casasbahia": "https://www.casasbahia.com.br/produto/XXXXX",
        "magazineluiza": "https://www.magazineluiza.com.br/XXXXX",
        "mercadolivre": "https://produto.mercadolivre.com.br/XXXXX"
      }
    }
  ]
}
```

> **Importante**: Substitua as URLs de exemplo pelas URLs reais dos produtos nas lojas.

### 4. Rodar o Projeto

#### Opção A: Interface apenas (testes)
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)
> Clique em "Atualizar" manualmente para buscar preços

#### Opção B: Com monitoramento automático 24/7 (recomendado)
```bash
npm run dev:full
```
> Roda servidor + worker em background. Atualiza automaticamente!

#### Opção C: Separadamente
```bash
# Terminal 1 - Servidor
npm run dev

# Terminal 2 - Worker (monitoramento automático)
npm run worker
```

**📖 Como funciona o monitoramento automático?**
Veja todas as opções em: [MONITORING_OPTIONS.md](MONITORING_OPTIONS.md)
- Local 24/7: Worker Node.js
- Produção (Vercel): Cron Jobs automáticos
- Alternativas: GitHub Actions, Cron-job.org

## 📁 Estrutura do Projeto

```
price-monitor/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── scrape/route.ts     # Endpoint para scraping
│   │   │   ├── prices/route.ts     # Endpoint para obter preços
│   │   │   └── history/route.ts    # Endpoint para histórico
│   │   ├── page.tsx                # Página principal
│   │   ├── layout.tsx              # Layout do app
│   │   └── globals.css             # Estilos globais
│   ├── components/
│   │   ├── PriceCard.tsx           # Card de preço por loja
│   │   └── PriceHistory.tsx        # Gráfico de histórico
│   └── lib/
│       ├── scrapers/
│       │   ├── base.ts             # Classe base dos scrapers
│       │   ├── amazon.ts           # Scraper Amazon
│       │   ├── casasbahia.ts       # Scraper Casas Bahia
│       │   ├── magazineluiza.ts    # Scraper Magazine Luiza
│       │   ├── mercadolivre.ts     # Scraper Mercado Livre
│       │   └── index.ts            # Factory de scrapers
│       ├── storage.ts              # Gerenciamento de dados
│       ├── notifier.ts             # Sistema de notificações
│       └── types.ts                # Tipos TypeScript
├── config/
│   └── products.json               # Configuração de produtos
├── data/                           # Dados persistidos (gerado automaticamente)
│   ├── latest-prices.json          # Últimos preços
│   └── prices-history.json         # Histórico completo
├── .env.local                      # Variáveis de ambiente (criar)
├── .env.example                    # Exemplo de .env
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🎯 Como Usar

### Interface Principal

1. **Visualização de Preços**
   - Cada produto mostra cards com preços de todas as lojas
   - Cards ficam VERDES e PISCANTES quando atingem o preço-alvo
   - Mostra status de disponibilidade e porcentagem do alvo

2. **Atualização Automática**
   - Sistema atualiza automaticamente a cada 30 minutos (configurável)
   - Contador regressivo mostra tempo para próxima atualização
   - Botão "Atualizar" para forçar checagem manual

3. **Histórico de Preços**
   - Gráfico interativo mostrando evolução dos preços
   - Tabela com últimos preços de cada loja
   - Útil para identificar tendências

### Notificações por Email

Quando um preço atinge o alvo, você receberá um email com:
- Nome do produto e loja
- Preço atual e economia
- Link direto para compra
- Timestamp da captura

## 🔧 Configurações Avançadas

### Alterar Intervalo de Checagem

No `.env.local`:
```env
CHECK_INTERVAL=15  # Checagem a cada 15 minutos
```

### Adicionar Novos Produtos

No `config/products.json`:
```json
{
  "id": "novo-produto",
  "name": "Nome do Produto",
  "targetPrice": 2000,
  "urls": {
    "amazon": "URL_AMAZON",
    "casasbahia": "URL_CASAS_BAHIA"
  }
}
```

### Desabilitar Lojas

No `config/products.json`, seção `stores`:
```json
{
  "id": "mercadolivre",
  "name": "Mercado Livre",
  "enabled": false  // Desabilita esta loja
}
```

### Criar Scrapers Customizados

Para adicionar uma nova loja, crie um arquivo em `src/lib/scrapers/`:

```typescript
import { BaseScraper } from './base';

export class MinhaLojaScraper extends BaseScraper {
  async scrape(url: string) {
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    // Sua lógica de scraping aqui
    const priceText = $('.preco-selector').text();
    const price = this.extractPrice(priceText);

    return {
      price,
      available: price !== null,
    };
  }
}
```

## 🌐 Deploy na Vercel

### 1. Prepare o projeto

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Faça login
vercel login
```

### 2. Deploy

```bash
# Deploy de produção
vercel --prod
```

### 3. Configure variáveis de ambiente

No painel da Vercel:
1. Vá em "Settings" > "Environment Variables"
2. Adicione todas as variáveis do `.env.local`
3. Redeploy o projeto

> **Nota**: No Vercel, o scraping funcionará server-side nas API routes.

## 📊 API Endpoints

### GET `/api/scrape`
Força uma nova checagem de preços em todas as lojas.

**Resposta:**
```json
{
  "success": true,
  "prices": [...],
  "timestamp": "2025-11-13T10:30:00.000Z",
  "duration": 12500
}
```

### GET `/api/prices`
Retorna os últimos preços salvos (sem fazer scraping).

### GET `/api/history?productId=xxx&store=xxx`
Retorna histórico de preços.

## 🛠️ Troubleshooting

### Preços não são encontrados

**Problema**: Scraper retorna "Preço não encontrado"

**Soluções**:
1. Verifique se a URL está correta
2. Acesse a URL manualmente e inspecione o HTML
3. Atualize os seletores CSS no scraper correspondente
4. Sites podem ter proteção anti-bot (considere usar proxies)

### Emails não são enviados

**Problema**: Notificações não chegam

**Soluções**:
1. Verifique as credenciais SMTP no `.env.local`
2. Use senha de app (não a senha normal)
3. Verifique spam/lixo eletrônico
4. Teste a conexão SMTP manualmente

### Erro de CORS

**Problema**: "CORS policy blocked"

**Solução**: Isso não deve acontecer pois o scraping é server-side. Se acontecer, verifique se está fazendo fetch correto para `/api/*`.

### Performance lenta

**Problema**: Scraping muito demorado

**Soluções**:
1. Reduza o número de lojas monitoradas
2. Aumente o intervalo de checagem
3. Use caching mais agressivo
4. Considere fazer scraping paralelo (já implementado)

## 🚨 Avisos Importantes

### Ética de Web Scraping

- ✅ Use delays apropriados (já implementado)
- ✅ Respeite robots.txt
- ✅ Não sobrecarregue os servidores
- ❌ Não use para revenda de dados
- ❌ Não faça scraping muito agressivo

### Limitações

- Sites podem mudar estrutura HTML a qualquer momento
- Proteções anti-bot podem bloquear requisições
- Alguns sites podem exigir JavaScript (considere Puppeteer)
- Rate limiting pode aplicar

### Alternativas

Para produção séria, considere usar APIs oficiais:
- [Mercado Livre API](https://developers.mercadolivre.com.br/)
- Amazon Product Advertising API
- Ou serviços como [Apify](https://apify.com/), [ScraperAPI](https://www.scraperapi.com/)

## 📝 Licença

MIT - Sinta-se livre para usar e modificar!

## 🤝 Contribuindo

Contribuições são bem-vindas! Para adicionar novos scrapers ou melhorias:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📧 Suporte

Dúvidas ou problemas? Abra uma issue no GitHub!

---

**Desenvolvido com ❤️ para a Black Friday 2025**

Boas compras! 🛍️
