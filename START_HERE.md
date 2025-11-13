# 🚀 COMECE AQUI - Primeira Execução

## ⚡ 3 Passos para Testar Agora (2 minutos)

### 1. Instale

```bash
npm install
```

### 2. Configure (rápido)

```bash
node scripts/setup.js
```

Responda as perguntas básicas (email, senha de app, etc).

### 3. Rode

```bash
npm run dev:full
```

**Pronto!** Acesse http://localhost:3000 🎉

---

## 🎯 O que você verá

### Na Interface (Browser):
```
┌─────────────────────────────────────────┐
│     📊 Monitor de Preços                │
│                                         │
│  [🔄 Atualizar] ← Clique aqui primeiro │
│                                         │
│  TCL C755 65"                          │
│  ┌──────────┐  ┌──────────┐           │
│  │ Amazon   │  │ Casas B. │           │
│  │ R$ ???   │  │ R$ ???   │           │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

### No Terminal 1 (Servidor):
```
ready - started server on 0.0.0.0:3000
```

### No Terminal 2 (Worker):
```
🤖 Worker de Monitoramento Iniciado

[13/11/2025 10:30:00] 🔍 Iniciando scraping...
✅ Scraping concluído em 12500ms
📊 8 preços coletados
⏳ Próxima checagem em 30 minutos...
```

---

## ❓ FAQ - Primeira Execução

### 1. "Preço não disponível" nos cards

**Normal!** URLs de exemplo não funcionam. Faça isso:

1. Acesse Amazon/Casas Bahia/Magazine Luiza
2. Busque "TCL C755 65" (ou o produto que você quer)
3. Copie a URL completa
4. Cole em `config/products.json`:

```json
{
  "products": [
    {
      "urls": {
        "amazon": "https://www.amazon.com.br/dp/CODIGO_REAL_AQUI"
      }
    }
  ]
}
```

5. Clique "Atualizar" novamente

### 2. "Email não enviado"

**Causa**: Senha incorreta ou não é senha de APP.

**Solução**:

1. Acesse: https://myaccount.google.com/apppasswords
2. Gere uma senha de APP (não use sua senha normal!)
3. Cole no `.env.local`:
   ```env
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
4. Teste: `npm run test:email`

### 3. "Worker não conecta ao servidor"

**Causa**: Servidor não está rodando ainda.

**Solução**:

```bash
# Sempre inicie o servidor PRIMEIRO
npm run dev

# Aguarde aparecer "ready - started server"

# SÓ ENTÃO inicie o worker (outro terminal)
npm run worker
```

**Ou use tudo junto**:
```bash
npm run dev:full
```

### 4. "Module not found"

**Causa**: Dependências não instaladas.

**Solução**:
```bash
npm install
```

### 5. Como saber se está funcionando?

**Checklist**:

- [ ] `npm run dev` → "ready - started server" ✅
- [ ] `npm run worker` → "Worker de Monitoramento Iniciado" ✅
- [ ] Browser → http://localhost:3000 carrega ✅
- [ ] Clicou "Atualizar" → Vê "Atualizando..." ✅
- [ ] Cards mostram preços (ou erro) ✅
- [ ] Terminal 2 → "Scraping concluído" ✅

**Se todos ✅ → Tudo certo!**

---

## 🎓 Próximos Passos

Agora que está rodando, escolha seu cenário:

### Para apenas testar hoje:
✅ Deixe `npm run dev:full` rodando e pronto!

### Para monitorar durante a Black Friday:
📖 Leia: [HOW_AUTO_MONITORING_WORKS.md](HOW_AUTO_MONITORING_WORKS.md)
- Opção local 24/7: Worker + PM2
- Opção nuvem 24/7: Vercel Deploy

### Para adicionar mais produtos:
📖 Leia: [USAGE_GUIDE.md](USAGE_GUIDE.md) → Cenário 5

### Para entender como funciona:
📖 Leia: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🔥 Modo Rápido: Deploy na Vercel (5 min)

Quer rodar 24/7 na nuvem SEM deixar PC ligado?

```bash
# 1. Instale a CLI
npm i -g vercel

# 2. Faça login
vercel login

# 3. Deploy
vercel --prod

# 4. Configure env vars no painel da Vercel
# (Copie e cole do seu .env.local)

# 5. Pronto! Acesse a URL fornecida
```

**Resultado**: Roda sozinho na nuvem por tempo indeterminado! 🚀

---

## 📚 Documentação Completa

- **[README.md](README.md)** - Guia completo
- **[QUICKSTART.md](QUICKSTART.md)** - Setup rápido
- **[HOW_AUTO_MONITORING_WORKS.md](HOW_AUTO_MONITORING_WORKS.md)** - Como funciona o monitoramento
- **[MONITORING_OPTIONS.md](MONITORING_OPTIONS.md)** - Todas as opções de monitoramento
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Cenários práticos
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura técnica
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Integração com outros sistemas

---

## 🆘 Ajuda Rápida

### Comandos úteis:

```bash
# Ver todos os comandos
npm run

# Testar configuração de email
npm run test:email

# Testar scrapers
npm run test:scraper

# Rodar completo (servidor + worker)
npm run dev:full

# Apenas servidor
npm run dev

# Apenas worker
npm run worker
```

### Arquivos importantes:

- **`.env.local`** - Suas credenciais (EMAIL, etc)
- **`config/products.json`** - Produtos e URLs
- **`data/latest-prices.json`** - Últimos preços salvos
- **`data/prices-history.json`** - Histórico completo

---

## ✨ Dica Final

**Teste primeiro com apenas 1 produto e 1 loja!**

```json
{
  "products": [
    {
      "id": "teste",
      "name": "Produto Teste",
      "targetPrice": 100,
      "urls": {
        "amazon": "URL_REAL_AQUI"
      }
    }
  ],
  "stores": [
    {
      "id": "amazon",
      "name": "Amazon BR",
      "enabled": true
    }
  ]
}
```

Funcionou? Adicione mais produtos e lojas! 🎯

---

**Tudo funcionando?** 🎉

Agora é só **configurar URLs reais** e **deixar rodando** durante a Black Friday!

**Problemas?** Veja [USAGE_GUIDE.md](USAGE_GUIDE.md) → Cenário 10 (Troubleshooting)

Boas compras! 🛍️✨
