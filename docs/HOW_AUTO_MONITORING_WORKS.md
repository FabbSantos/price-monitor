# 🤖 Como Funciona o Monitoramento Automático?

## 📺 Resumo Visual

```
╔══════════════════════════════════════════════════════════════╗
║                   3 FORMAS DE MONITORAR                       ║
╚══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ 1️⃣  CLIENTE (Browser) - Página precisa estar aberta         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser aberto → setInterval(30min) → fetch('/api/scrape') │
│                                                              │
│  ✅ Simples                                                  │
│  ❌ Precisa manter página aberta                            │
│                                                              │
│  📝 Código: src/app/page.tsx:59-70                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2️⃣  WORKER (Node.js) - Roda em background local            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Terminal → node worker.js → setInterval(30min)             │
│                     ↓                                        │
│              fetch('http://localhost:3000/api/scrape')      │
│                                                              │
│  ✅ Pode fechar o browser                                   │
│  ✅ Roda em background                                      │
│  ❌ Precisa manter PC ligado                                │
│                                                              │
│  📝 Código: worker.js                                       │
│  🚀 Comando: npm run worker                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3️⃣  VERCEL CRON - Roda 24/7 na nuvem                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Vercel Scheduler → */30 * * * * → POST /api/scrape         │
│                                                              │
│  ✅ Roda 24/7 (não precisa PC ligado)                       │
│  ✅ Grátis até 100 invocações/dia                           │
│  ✅ Automático (não precisa fazer nada)                     │
│  ❌ Só funciona depois do deploy                            │
│                                                              │
│  📝 Código: vercel.json                                     │
│  🚀 Deploy: vercel --prod                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Comparação Detalhada

| Característica | Cliente (Browser) | Worker (Node.js) | Vercel Cron |
|----------------|-------------------|------------------|-------------|
| **Browser aberto?** | ✅ Sim | ❌ Não | ❌ Não |
| **PC ligado?** | ✅ Sim | ✅ Sim | ❌ Não |
| **Roda 24/7?** | ❌ Não | ⚠️ Depende | ✅ Sim |
| **Custo** | Grátis | Grátis | Grátis* |
| **Complexidade** | Baixa | Média | Baixa |
| **Setup** | Nenhum | 2 terminais | Deploy |
| **Logs** | Console do browser | Terminal | Vercel Dashboard |

*Grátis até 100 execuções/dia

## 🎯 Qual Usar?

### Use **Cliente** se:
- ✅ Você vai ficar com a página aberta mesmo
- ✅ Quer apenas testar rapidinho
- ✅ Não se importa de clicar "Atualizar" manualmente

### Use **Worker** se:
- ✅ Quer monitorar hoje/essa semana localmente
- ✅ Vai deixar o PC ligado
- ✅ Quer ver logs em tempo real
- ✅ Não quer fazer deploy

### Use **Vercel Cron** se:
- ✅ Quer monitorar durante toda a Black Friday
- ✅ Não quer deixar PC ligado 24/7
- ✅ Quer acessar de qualquer lugar
- ✅ Quer compartilhar com amigos

## 📖 Exemplo Prático: Black Friday (1 semana)

### Opção 1: Cliente (NÃO RECOMENDADO)

```bash
npm run dev
# Mantenha a aba aberta por 7 dias
# Não deixe o PC entrar em sleep
# Não feche o browser
```

**Problema**: Se fechar ou PC dormir, para de monitorar!

---

### Opção 2: Worker (RECOMENDADO LOCAL)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker
```

**Melhor ainda - com PM2**:
```bash
npm install -g pm2
pm2 start npm --name "server" -- run dev
pm2 start worker.js --name "worker"
pm2 save
pm2 startup
```

**Resultado**: Roda 24/7, sobrevive a fechamento de terminal, reinicia se crashar.

---

### Opção 3: Vercel (MELHOR PARA BLACK FRIDAY)

```bash
vercel --prod
# Configure env vars no painel
# Pronto! Esquece que existe.
```

**Resultado**:
- ✅ Roda sozinho por 7 dias
- ✅ Você desliga o PC
- ✅ Abre de qualquer lugar
- ✅ Amigos podem ver também

## 🧪 Como Testar Cada Opção

### Teste Cliente:

```bash
npm run dev
# Abra http://localhost:3000
# Aguarde 30 minutos
# Ou clique "Atualizar" manualmente
```

### Teste Worker:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker

# Veja logs no Terminal 2:
# "Scraping concluído em Xms"
# "Próxima checagem em 30 minutos"
```

### Teste Vercel Cron:

```bash
vercel --prod

# Aguarde 30 minutos
# Ou acesse: Vercel Dashboard → Functions → Logs
# Ou force manualmente:
curl https://seu-app.vercel.app/api/scrape
```

## 🔧 Ajustando o Intervalo

### Cliente (page.tsx):

```typescript
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutos
```

### Worker (.env.local):

```env
CHECK_INTERVAL=15  # 15 minutos
```

### Vercel (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "*/15 * * * *"  // 15 minutos
    }
  ]
}
```

## 🚨 Avisos Importantes

### ⚠️ Cliente (Browser)

- Fecha a aba = PARA de monitorar
- PC entra em sleep = PARA de monitorar
- Reinicia o browser = PARA de monitorar

**Solução**: Use Worker ou Vercel!

### ⚠️ Worker (Node.js)

- Fecha o terminal = PARA de monitorar
- Desliga o PC = PARA de monitorar
- Erro não tratado = PODE parar de monitorar

**Solução**: Use PM2 (reinicia automaticamente) ou Vercel!

### ⚠️ Vercel Cron

- Limit de 100 invocações/dia (free)
- Timeout de 10 segundos (free) / 60s (Pro)
- Cold starts podem demorar

**Solução**: Upgrade para Pro se necessário!

## 💡 Dica Pro

**Combine as opções!**

```bash
# Durante o desenvolvimento (hoje):
npm run dev:full

# Quando for dormir:
vercel --prod

# Resultado:
# - Monitora local enquanto você trabalha
# - Monitora na nuvem quando você dorme
# - Melhor dos dois mundos!
```

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────┐
│  TRIGGER (Como o scraping é acionado)       │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   setInterval │   │  Vercel Cron  │
│   (Cliente ou │   │   Scheduler   │
│    Worker)    │   │               │
└───────┬───────┘   └───────┬───────┘
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  /api/scrape    │
        │  (API Route)    │
        └─────────┬───────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   Scrapers    │   │   Notifier    │
│  (4 lojas)    │   │   (Email)     │
└───────┬───────┘   └───────┬───────┘
        │                   │
        ▼                   ▼
┌───────────────────────────────────┐
│         Storage (JSON)            │
│  - latest-prices.json             │
│  - prices-history.json            │
└───────────────────────────────────┘
```

## ✅ Checklist Final

Antes de começar a Black Friday:

- [ ] Configurou `.env.local` com email
- [ ] Testou email: `npm run test:email`
- [ ] Adicionou URLs reais em `config/products.json`
- [ ] Testou scrapers: `npm run test:scraper`
- [ ] Escolheu opção de monitoramento:
  - [ ] Local com Worker + PM2
  - [ ] Nuvem com Vercel Cron
- [ ] Testou recebimento de alerta
- [ ] Configurou intervalos adequados

## 🆘 Perguntas Frequentes

**P: Posso usar as 3 opções ao mesmo tempo?**
R: Tecnicamente sim, mas você vai receber notificações em triplicado! Escolha apenas 1.

**P: Qual a mais confiável?**
R: Vercel Cron (nunca cai, mantém 99.99% uptime).

**P: Qual a mais barata?**
R: Todas são gratuitas até certo limite.

**P: Posso ver logs em tempo real?**
R: Worker (sim, no terminal). Vercel (sim, no dashboard). Cliente (sim, console do browser).

**P: E se crashar?**
R: Worker + PM2 reinicia automaticamente. Vercel é stateless (não crasha). Cliente você precisa recarregar manualmente.

---

**Resumo de 1 frase**:

> Use **Worker** para monitorar localmente hoje/essa semana, ou **Vercel Cron** para monitorar 24/7 durante toda a Black Friday sem se preocupar! 🚀

**Dúvidas?** Veja os outros guias! 📚
