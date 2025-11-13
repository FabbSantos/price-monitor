# 🔌 Exemplos de Uso da API

O Monitor de Preços expõe APIs REST que você pode usar programaticamente.

## Endpoints Disponíveis

### 1. GET `/api/scrape`

Força uma nova checagem de preços em todas as lojas.

**Exemplo:**

```bash
curl http://localhost:3000/api/scrape
```

**Resposta:**

```json
{
  "success": true,
  "prices": [
    {
      "productId": "tcl-c755-65",
      "productName": "TCL C755 65\"",
      "store": "amazon",
      "storeName": "Amazon BR",
      "price": 3899.99,
      "url": "https://www.amazon.com.br/...",
      "timestamp": "2025-11-13T10:30:00.000Z",
      "available": true
    }
  ],
  "timestamp": "2025-11-13T10:30:00.000Z",
  "duration": 12500
}
```

### 2. GET `/api/prices`

Retorna os últimos preços salvos (sem fazer scraping).

**Exemplo:**

```bash
curl http://localhost:3000/api/prices
```

**Resposta:**

```json
{
  "success": true,
  "prices": [...],
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

### 3. GET `/api/history`

Retorna o histórico completo de preços.

**Exemplo:**

```bash
curl http://localhost:3000/api/history
```

**Resposta:**

```json
{
  "success": true,
  "history": [
    {
      "productId": "tcl-c755-65",
      "store": "amazon",
      "prices": [
        {
          "price": 4200.00,
          "timestamp": "2025-11-13T08:00:00.000Z"
        },
        {
          "price": 3899.99,
          "timestamp": "2025-11-13T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

### 4. GET `/api/history?productId=xxx&store=xxx`

Retorna o histórico de um produto específico em uma loja.

**Exemplo:**

```bash
curl http://localhost:3000/api/history?productId=tcl-c755-65&store=amazon
```

## Casos de Uso

### 1. Integração com Scripts Python

```python
import requests
import time

API_BASE = "http://localhost:3000/api"

def check_prices():
    response = requests.get(f"{API_BASE}/scrape")
    data = response.json()

    for price in data['prices']:
        if price['price'] and price['price'] < 4000:
            print(f"🎯 ALERTA: {price['productName']} por R$ {price['price']}")

# Executa a cada 30 minutos
while True:
    check_prices()
    time.sleep(1800)
```

### 2. Webhook para Slack/Discord

```javascript
// webhook.js
const axios = require('axios');

async function checkAndNotify() {
  const { data } = await axios.get('http://localhost:3000/api/scrape');

  for (const price of data.prices) {
    if (price.price && price.price <= price.targetPrice) {
      // Envia para Slack
      await axios.post(process.env.SLACK_WEBHOOK, {
        text: `🎯 ${price.productName} por R$ ${price.price} em ${price.storeName}!`,
        attachments: [{
          color: 'good',
          fields: [
            { title: 'Preço', value: `R$ ${price.price}`, short: true },
            { title: 'Loja', value: price.storeName, short: true }
          ],
          actions: [{
            type: 'button',
            text: 'Ver Produto',
            url: price.url
          }]
        }]
      });
    }
  }
}

setInterval(checkAndNotify, 30 * 60 * 1000);
```

### 3. Automação com Node-RED

Crie um flow que:
1. Chama `/api/scrape` a cada 30 min
2. Filtra preços abaixo do alvo
3. Envia notificação via Telegram/WhatsApp
4. Salva em banco de dados SQL

**Exemplo de Flow:**

```json
[
  {
    "id": "timer",
    "type": "inject",
    "repeat": "1800",
    "name": "A cada 30 min"
  },
  {
    "id": "scrape",
    "type": "http request",
    "method": "GET",
    "url": "http://localhost:3000/api/scrape"
  },
  {
    "id": "filter",
    "type": "function",
    "func": "msg.payload = msg.payload.prices.filter(p => p.price && p.price <= p.targetPrice); return msg;"
  },
  {
    "id": "notify",
    "type": "telegram sender",
    "chatId": "YOUR_CHAT_ID"
  }
]
```

### 4. Dashboard Customizado

```html
<!DOCTYPE html>
<html>
<head>
  <title>Monitor de Preços</title>
  <script>
    async function loadPrices() {
      const response = await fetch('/api/prices');
      const data = await response.json();

      const container = document.getElementById('prices');
      container.innerHTML = data.prices.map(p => `
        <div class="price-card">
          <h3>${p.productName}</h3>
          <p>${p.storeName}: R$ ${p.price || 'N/A'}</p>
        </div>
      `).join('');
    }

    // Atualiza a cada 5 minutos
    setInterval(loadPrices, 5 * 60 * 1000);
    loadPrices();
  </script>
</head>
<body>
  <div id="prices"></div>
</body>
</html>
```

### 5. CLI Tool

```bash
#!/bin/bash
# check-prices.sh

API="http://localhost:3000/api"

echo "🔍 Checando preços..."
curl -s "$API/scrape" | jq -r '.prices[] | select(.price != null and .price <= .targetPrice) | "🎯 \(.productName) por R$ \(.price) em \(.storeName)"'
```

Execute:
```bash
chmod +x check-prices.sh
./check-prices.sh
```

### 6. Exportar para CSV

```javascript
// export-csv.js
const axios = require('axios');
const fs = require('fs');

async function exportCSV() {
  const { data } = await axios.get('http://localhost:3000/api/history');

  let csv = 'Produto,Loja,Preço,Data\n';

  for (const entry of data.history) {
    for (const price of entry.prices) {
      csv += `${entry.productId},${entry.store},${price.price},${price.timestamp}\n`;
    }
  }

  fs.writeFileSync('prices.csv', csv);
  console.log('✅ CSV exportado para prices.csv');
}

exportCSV();
```

### 7. Análise de Tendências

```python
import requests
import pandas as pd
import matplotlib.pyplot as plt

# Busca histórico
response = requests.get('http://localhost:3000/api/history')
history = response.json()['history']

# Converte para DataFrame
data = []
for entry in history:
    for price in entry['prices']:
        data.append({
            'product': entry['productId'],
            'store': entry['store'],
            'price': price['price'],
            'timestamp': price['timestamp']
        })

df = pd.DataFrame(data)
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Plota gráfico
df.groupby(['timestamp', 'store'])['price'].mean().unstack().plot()
plt.title('Evolução de Preços')
plt.ylabel('Preço (R$)')
plt.show()
```

## Autenticação (Opcional)

Para proteger sua API em produção, adicione autenticação:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization');

  if (token !== `Bearer ${process.env.API_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

Use:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/scrape
```

## Rate Limiting

Para evitar abuso:

```typescript
// src/app/api/scrape/route.ts
const lastRequest = new Map<string, number>();

export async function GET(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const lastTime = lastRequest.get(ip) || 0;

  // 1 request a cada 5 minutos por IP
  if (now - lastTime < 5 * 60 * 1000) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  lastRequest.set(ip, now);

  // ... resto do código
}
```

---

Use essas APIs para criar integrações customizadas! 🚀
