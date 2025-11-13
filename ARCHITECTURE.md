# 🏗️ Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    PRICE MONITOR SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser    │      │  Worker.js   │      │ Vercel Cron  │
│  (Cliente)   │      │  (Local)     │      │  (Produção)  │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ GET /api/scrape     │ GET /api/scrape    │ Scheduled
       │ (Manual)            │ (Auto a cada 30min)│ (*/30 * * * *)
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             ▼
                    ┌────────────────┐
                    │  Next.js API   │
                    │  /api/scrape   │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        ┌───────────────┐         ┌──────────────┐
        │   Scrapers    │         │  Notifier    │
        │ (4 lojas)     │         │  (Email)     │
        └───────┬───────┘         └──────┬───────┘
                │                        │
    ┌───────────┼────────────┐           │
    │           │            │           │
    ▼           ▼            ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Amazon │ │Casas B.│ │Mag Luiza│ │SMTP      │
└────────┘ └────────┘ └────────┘ │Server    │
                                  └──────────┘
                ▼
        ┌───────────────┐
        │   Storage     │
        │ (JSON Files)  │
        └───────────────┘
         latest-prices.json
         prices-history.json
```

## Fluxo de Dados

### 1️⃣ Trigger (Como o scraping é acionado)

**Opção A - Manual (Cliente)**:
```
Usuário clica "Atualizar"
    ↓
Browser faz fetch('/api/scrape')
    ↓
Next.js API route processa
```

**Opção B - Automático (Worker)**:
```
setInterval(30 minutos)
    ↓
Worker.js faz fetch('http://localhost:3000/api/scrape')
    ↓
Next.js API route processa
```

**Opção C - Automático (Vercel)**:
```
Vercel Cron (*/30 * * * *)
    ↓
Chama /api/scrape automaticamente
    ↓
Next.js API route processa
```

### 2️⃣ Scraping (O que acontece internamente)

```
API /api/scrape recebe requisição
    ↓
Carrega config/products.json
    ↓
Para cada produto:
    ↓
    Para cada loja habilitada:
        ↓
        1. Seleciona scraper apropriado (Factory)
        ↓
        2. Faz requisição HTTP com headers anti-bot
        ↓
        3. Delay aleatório (1-3s)
        ↓
        4. Parse HTML com Cheerio
        ↓
        5. Extrai preço usando seletores CSS
        ↓
        6. Valida e formata preço
        ↓
        7. Verifica disponibilidade
        ↓
        8. Retorna { price, available, error? }
    ↓
    9. Compara com preço-alvo
    ↓
    10. Se preço <= alvo → Notifica via email
    ↓
11. Salva em latest-prices.json
    ↓
12. Adiciona ao prices-history.json
    ↓
13. Retorna resultados ao cliente
```

### 3️⃣ Notificação (Email)

```
Preço <= Preço-alvo?
    ↓ Sim
Já notificou este preço antes?
    ↓ Não
Cria email HTML com template
    ↓
Envia via SMTP (Nodemailer)
    ↓
Marca como notificado (cache)
```

### 4️⃣ Interface (React)

```
useEffect (componentDidMount)
    ↓
Carrega preços salvos (GET /api/prices)
    ↓
Carrega histórico (GET /api/history)
    ↓
setInterval (atualização periódica)
    ↓
A cada 30 min: fetch('/api/scrape')
    ↓
Atualiza state com novos preços
    ↓
React re-renderiza componentes
    ↓
PriceCard detecta preço <= alvo
    ↓
Aplica classe CSS "animate-price-alert"
    ↓
Card pisca verde!
```

## Componentes Principais

### 🎨 Frontend (React/Next.js)

```
src/app/
├── page.tsx              → Página principal
│   ├── useState          → prices, history, loading
│   ├── useEffect         → Auto-update loop
│   └── Components:
│       ├── PriceCard     → Card individual por loja
│       └── PriceHistory  → Gráfico Recharts
│
└── layout.tsx            → Layout global
```

### 🔌 API Routes (Next.js)

```
src/app/api/
├── scrape/route.ts       → Faz scraping completo
│   ├── Carrega produtos de config.json
│   ├── Itera por lojas
│   ├── Chama scrapers
│   ├── Compara com metas
│   ├── Envia notificações
│   └── Salva dados
│
├── prices/route.ts       → Retorna últimos preços (cache)
│   └── Lê latest-prices.json
│
└── history/route.ts      → Retorna histórico
    └── Lê prices-history.json
```

### 🕷️ Scrapers (Web Scraping)

```
src/lib/scrapers/
├── base.ts               → Classe abstrata
│   ├── fetchPage()       → HTTP request com retry
│   ├── extractPrice()    → Parse de string → número
│   ├── delay()           → Sleep anti-bot
│   └── getRandomUA()     → User-Agent aleatório
│
├── amazon.ts             → Implementação Amazon
├── casasbahia.ts         → Implementação Casas Bahia
├── magazineluiza.ts      → Implementação Magazine Luiza
├── mercadolivre.ts       → Implementação Mercado Livre
│
└── index.ts              → Factory pattern
    └── getScraperForStore(id)
```

### 💾 Storage (Persistência)

```
src/lib/storage.ts
├── saveLatestPrices()    → Salva última snapshot
├── loadLatestPrices()    → Carrega última snapshot
├── addToHistory()        → Append ao histórico
├── loadHistory()         → Carrega histórico completo
└── getProductHistory()   → Filtra por produto/loja

data/
├── latest-prices.json    → Estado atual (sobrescreve)
└── prices-history.json   → Série temporal (append)
```

### 📧 Notifier (Email)

```
src/lib/notifier.ts
├── Notifier class
│   ├── transporter       → Nodemailer SMTP
│   ├── notifiedPrices    → Set (cache)
│   ├── shouldNotify()    → Verifica se deve notificar
│   ├── notify()          → Envia email
│   └── generateEmailHTML() → Template HTML
│
└── getNotifier()         → Singleton
```

## Padrões de Design

### 1. Factory Pattern (Scrapers)

```typescript
// Factory cria o scraper correto baseado na loja
const scraper = getScraperForStore('amazon');
// → new AmazonScraper()
```

### 2. Template Method (BaseScraper)

```typescript
abstract class BaseScraper {
  // Métodos comuns implementados
  protected fetchPage() { ... }
  protected extractPrice() { ... }

  // Método abstrato - cada scraper implementa
  abstract scrape(url: string): Promise<Result>;
}
```

### 3. Singleton (Notifier)

```typescript
let instance: Notifier | null = null;

export function getNotifier() {
  if (!instance) {
    instance = new Notifier();
  }
  return instance;
}
```

### 4. Strategy Pattern (Storage)

```typescript
// Facilmente substituível por DB
interface Storage {
  save(data: PriceData[]): void;
  load(): PriceData[];
}

class JSONStorage implements Storage { ... }
class PostgreSQLStorage implements Storage { ... }
```

## Tratamento de Erros

### Camadas de Proteção

```
1. Scraper Level (Retry + Backoff)
   ├─ Tentativa 1 falhou → aguarda 2s
   ├─ Tentativa 2 falhou → aguarda 4s
   └─ Tentativa 3 falhou → retorna erro

2. API Level (Try/Catch)
   ├─ Scraper falhou → retorna { price: null, error: "..." }
   └─ Continua para próxima loja

3. Worker Level (Process monitoring)
   ├─ API falhou → loga erro
   └─ Continua loop (não mata o processo)

4. Frontend Level (Error boundaries)
   ├─ API falhou → mostra mensagem
   └─ Permite retry manual
```

## Segurança

### Anti-Bot Measures

```
✅ User-Agent aleatório (roda entre 3 opções)
✅ Delays entre requests (1-3 segundos)
✅ Headers realistas (Accept, Accept-Language, etc)
✅ Timeout de 15 segundos
✅ Máximo 5 redirects
✅ Cookies habilitados
```

### Dados Sensíveis

```
✅ .env.local não commitado (.gitignore)
✅ Variáveis de ambiente no Vercel
✅ Senhas de email nunca expostas no frontend
✅ API routes server-side only
```

## Performance

### Otimizações

```
✅ Scraping paralelo (não sequencial)
✅ Cache de últimos preços (não refaz scraping)
✅ Histórico limitado a 100 entradas por produto
✅ JSON files (não precisa DB para pequeno volume)
✅ React memo nos componentes
✅ Lazy loading de gráficos
```

### Limitações

```
⚠️ 1 scraping por loja = ~2-5 segundos
⚠️ 4 lojas × 2 produtos = ~16-40 segundos total
⚠️ Vercel timeout: 10 segundos (Hobby) / 60s (Pro)
⚠️ Considere upgrade se tiver muitos produtos
```

## Escalabilidade

### Para mais produtos/lojas:

```typescript
// Adicione em config/products.json
{
  "products": [
    { "id": "novo-produto", ... }
  ],
  "stores": [
    { "id": "nova-loja", ... }
  ]
}

// Crie novo scraper
src/lib/scrapers/novaloja.ts

// Registre no factory
src/lib/scrapers/index.ts
```

### Para volume maior:

```
1. Migrar para banco de dados (PostgreSQL/MongoDB)
2. Usar fila de jobs (Bull/BullMQ)
3. Cache com Redis
4. CDN para assets estáticos
5. Puppeteer para sites com JS (mais lento mas mais robusto)
```

## Monitoramento

### Logs

```
✅ Console.log em cada etapa importante
✅ Timestamp de cada scraping
✅ Duração de cada operação
✅ Erros capturados e logados
✅ Alertas enviados logados
```

### Métricas úteis:

```
- Taxa de sucesso por loja
- Tempo médio de scraping
- Número de alertas enviados
- Uptime do worker
- Taxa de erro por scraper
```

## Testes

### Como testar:

```bash
# Teste email
npm run test:email

# Teste scrapers
npm run test:scraper

# Teste API manual
curl http://localhost:3000/api/scrape

# Teste worker
npm run worker
```

---

**Dúvidas sobre a arquitetura?** Consulte os outros docs! 📚
