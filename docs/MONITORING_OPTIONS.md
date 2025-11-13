# 🤖 Opções de Monitoramento Automático

Este documento explica **como fazer o scraping rodar automaticamente** a cada 30 minutos (ou o intervalo configurado).

## 📊 Comparação das Opções

| Opção | Onde Roda | Browser Aberto? | 24/7? | Complexidade |
|-------|-----------|-----------------|-------|--------------|
| **Cliente (atual)** | Browser | ✅ Sim | ❌ Não | ⭐ Fácil |
| **Worker Node.js** | Localmente | ❌ Não | ✅ Sim | ⭐⭐ Médio |
| **Vercel Cron** | Cloud (Vercel) | ❌ Não | ✅ Sim | ⭐ Fácil |
| **Cron-job.org** | Cloud (Externo) | ❌ Não | ✅ Sim | ⭐ Fácil |

---

## 🔵 Opção 1: Monitoramento no Cliente (ATUAL)

**Como funciona**: O `setInterval` roda no browser.

**Prós**:
- ✅ Já está implementado
- ✅ Fácil de usar
- ✅ Interface atualiza em tempo real

**Contras**:
- ❌ Precisa manter o browser aberto
- ❌ Fecha o browser = para de monitorar
- ❌ Consome recursos do computador

**Quando usar**: Para testes ou quando você vai ficar com a página aberta mesmo.

**Como usar**:
```bash
npm run dev
# Abra http://localhost:3000
# Mantenha a página aberta
```

---

## 🟢 Opção 2: Worker Node.js (RECOMENDADO LOCAL)

**Como funciona**: Um processo Node.js separado que chama a API a cada X minutos.

**Prós**:
- ✅ Roda em background 24/7
- ✅ Pode fechar o browser
- ✅ Logs no terminal
- ✅ Fácil de parar (Ctrl+C)

**Contras**:
- ❌ Precisa manter 2 processos rodando (Next.js + Worker)
- ❌ Não sobrevive a reinicialização do PC

**Quando usar**: Para monitoramento local contínuo.

### Como usar:

**Terminal 1** - Inicia o servidor:
```bash
npm run dev
```

**Terminal 2** - Inicia o worker:
```bash
npm run worker
```

Ou **tudo junto**:
```bash
npm run dev:full
```

**Saída esperada**:
```
🤖 Worker de Monitoramento Iniciado

📡 API: http://localhost:3000
⏰ Intervalo: 30 minutos

✅ Servidor Next.js detectado

[13/11/2025 10:30:00] 🔍 Iniciando scraping...
✅ Scraping concluído em 12500ms
📊 8 preços coletados

🎯 ALERTAS:

   - TCL C755 65" em Amazon BR: R$ 3899.99

⏳ Próxima checagem em 30 minutos...

💤 Worker em execução. Pressione Ctrl+C para parar.
```

### Rodar o worker como serviço (Windows)

Para que rode mesmo após fechar o terminal:

```bash
# Instale pm2 globalmente
npm install -g pm2

# Inicie o worker
pm2 start worker.js --name "price-monitor"

# Veja os logs
pm2 logs price-monitor

# Pare o worker
pm2 stop price-monitor

# Remova o worker
pm2 delete price-monitor
```

### Rodar o worker como serviço (Linux/Mac)

Crie um arquivo `systemd` (ou use `pm2` como acima):

```bash
# /etc/systemd/system/price-monitor.service
[Unit]
Description=Price Monitor Worker
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/price-monitor
ExecStart=/usr/bin/node worker.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable price-monitor
sudo systemctl start price-monitor
sudo systemctl status price-monitor
```

---

## 🔷 Opção 3: Vercel Cron Jobs (RECOMENDADO PRODUÇÃO)

**Como funciona**: A Vercel executa sua API route automaticamente no horário configurado.

**Prós**:
- ✅ Roda 24/7 na nuvem
- ✅ Grátis até 100 invocações/dia
- ✅ Não precisa servidor próprio
- ✅ Deploy fácil

**Contras**:
- ❌ Só funciona no Vercel (não local)
- ❌ Limite de 100 invocações/dia (plano gratuito)
- ❌ Cada scraping conta como 1 invocação

**Quando usar**: Para produção 24/7 sem custos.

### Como usar:

1. **Configure o `vercel.json`** (já está pronto):

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

2. **Deploy na Vercel**:

```bash
# Instale a CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel --prod
```

3. **Configure variáveis de ambiente**:

No painel da Vercel:
- Settings → Environment Variables
- Adicione todas as vars do `.env.local`
- Redeploy

4. **Pronto!** A Vercel vai chamar `/api/scrape` a cada 30 minutos.

### Schedules personalizados:

```json
"*/15 * * * *"   // A cada 15 minutos
"0 */2 * * *"    // A cada 2 horas
"0 8,12,18 * * *" // Às 8h, 12h e 18h
"0 9-21/2 * * *"  // Das 9h às 21h, a cada 2 horas
```

**Calculadora**: https://crontab.guru

### Limites do plano gratuito:

- 100 invocações/dia (cron)
- Serverless functions: 100 GB-Hrs/mês
- Bandwidth: 100 GB/mês

Se exceder, considere:
- Aumentar intervalo (ex: 1 hora)
- Upgrade para Vercel Pro ($20/mês)

---

## 🟡 Opção 4: Cron-job.org (ALTERNATIVA GRATUITA)

**Como funciona**: Um serviço externo chama sua API periodicamente.

**Prós**:
- ✅ 100% gratuito
- ✅ Não precisa Vercel
- ✅ Funciona com qualquer host
- ✅ Interface web simples

**Contras**:
- ❌ Precisa expor sua API (túnel ou deploy)
- ❌ Menos confiável que Vercel

**Quando usar**: Se não quiser usar Vercel ou tiver outro host.

### Como usar:

1. **Deploy seu projeto** (Vercel, Railway, Render, etc)

2. **Crie conta no cron-job.org**: https://cron-job.org/en/signup/

3. **Crie um novo cron job**:
   - URL: `https://seu-app.vercel.app/api/scrape`
   - Schedule: `Every 30 minutes`
   - Title: `Price Monitor`

4. **Ative o job** e pronto!

### Alternativas similares:

- **EasyCron**: https://www.easycron.com
- **cPanel Cron Jobs** (se tiver hospedagem cPanel)
- **GitHub Actions** (gratuito para repos públicos)

---

## 🟣 Opção 5: GitHub Actions (GRATUITO)

**Como funciona**: O GitHub executa um workflow periodicamente.

**Prós**:
- ✅ 100% gratuito
- ✅ 2000 minutos/mês (plano free)
- ✅ Funciona com qualquer deploy
- ✅ Versionado no Git

**Contras**:
- ❌ Precisa deploy (API pública)
- ❌ Mais complexo de configurar

### Como usar:

Crie `.github/workflows/scrape.yml`:

```yaml
name: Price Monitor

on:
  schedule:
    - cron: '*/30 * * * *'  # A cada 30 minutos
  workflow_dispatch:  # Permite execução manual

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Call Scrape API
        run: |
          curl -X GET https://seu-app.vercel.app/api/scrape
```

Commit e push. Pronto!

**Limitações**:
- Mínimo intervalo: 5 minutos (mas recomendado 30+)
- 2000 minutos/mês (grátis)

---

## 🎯 Qual Opção Escolher?

### Para Desenvolvimento/Testes:
→ **Opção 1** (Cliente no browser)

### Para Rodar Localmente 24/7:
→ **Opção 2** (Worker Node.js + PM2)

### Para Produção 24/7 (Recomendado):
→ **Opção 3** (Vercel Cron Jobs)

### Sem Vercel:
→ **Opção 4** (Cron-job.org) ou **Opção 5** (GitHub Actions)

---

## 🔧 Configuração Avançada

### Múltiplos workers para lojas diferentes

```javascript
// worker-amazon.js
const STORE_FILTER = 'amazon';
// ... chama API com filtro

// worker-mercadolivre.js
const STORE_FILTER = 'mercadolivre';
// ...
```

### Notificação quando worker cai

```javascript
// worker.js
process.on('uncaughtException', async (error) => {
  await sendEmail('Worker crashed!', error.message);
  process.exit(1);
});
```

### Webhook para monitorar uptime

Use serviços como:
- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com

Configure para pingar `/api/prices` a cada 5 minutos.

---

## 🆘 Troubleshooting

### Worker não conecta ao servidor

**Erro**: `ECONNREFUSED`

**Solução**:
```bash
# Terminal 1
npm run dev

# Aguarde "ready started server" aparecer
# Só então inicie o worker no Terminal 2
npm run worker
```

### Vercel Cron não executa

**Possíveis causas**:
1. Não está no plano Pro (alguns recursos são Pro only)
2. Sintaxe do cron incorreta
3. Variáveis de ambiente não configuradas

**Solução**:
- Verifique logs em: Vercel Dashboard → Deployments → Functions
- Teste manualmente: `curl https://seu-app.vercel.app/api/scrape`

### GitHub Actions não roda

**Possíveis causas**:
1. Repo privado sem Actions habilitado
2. Sintaxe YAML incorreta

**Solução**:
- Settings → Actions → Enable
- Use YAML validator online

---

## 📚 Referências

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Actions Schedule](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Crontab Guru](https://crontab.guru)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**Resumo**: Use **Worker Node.js** localmente e **Vercel Cron** em produção! 🚀
