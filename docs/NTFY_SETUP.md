# 📱 Configurar Notificações ntfy (Recomendado!)

**ntfy** é MUITO melhor que email! Notificações instantâneas no celular. 🔥

## Por que usar ntfy?

✅ **Instantâneo** - Notificação chega em 1-2 segundos
✅ **Grátis** - 100% gratuito, sem limites
✅ **Sem cadastro** - Não precisa conta
✅ **Multi-plataforma** - iOS, Android, Web, Desktop
✅ **Open Source** - Código aberto
✅ **Privado** - Você escolhe o tópico, ninguém mais vê

## Setup (3 minutos)

### 1️⃣ Instale o App

**iOS:**
https://apps.apple.com/app/ntfy/id1625396347

**Android:**
https://play.google.com/store/apps/details?id=io.heckel.ntfy

**Ou acesse:**
https://ntfy.sh/app

### 2️⃣ Escolha um Tópico Único

Escolha um nome único que ninguém mais vai usar:

**Exemplos:**
- `price-monitor-fabio-2025`
- `black-friday-alerts-xyz123`
- `tvs-tcl-fabio-abc`

**IMPORTANTE:** Use letras, números e hífens apenas. Sem espaços!

### 3️⃣ Inscreva-se no Tópico

No app:
1. Clique no **+** (ou "Subscribe")
2. Digite seu tópico (ex: `price-monitor-fabio-2025`)
3. Clique em "Subscribe"

### 4️⃣ Configure no Projeto

Edite `.env.local`:

```env
NTFY_TOPIC=price-monitor-fabio-2025
NTFY_SERVER=https://ntfy.sh
```

### 5️⃣ Teste

```bash
npm run test:ntfy
```

**Resultado esperado:**
```
📱 Testando notificações ntfy...

📡 Servidor: https://ntfy.sh
📋 Tópico: price-monitor-fabio-2025
🔗 URL: https://ntfy.sh/price-monitor-fabio-2025

🔄 Enviando notificação de teste...

✅ Notificação enviada com sucesso!

🎉 Verifique seu celular agora!
```

**No seu celular:** Você deve receber uma notificação! 🎉

---

## Como Funciona

```
Preço atinge meta
    ↓
Sistema envia HTTP POST para ntfy.sh
    ↓
ntfy.sh distribui para seus servidores
    ↓
App no seu celular recebe via push notification
    ↓
🔔 DING! Notificação aparece
```

**Tempo total:** ~1-2 segundos! ⚡

---

## Exemplo de Notificação

Quando o preço atingir sua meta, você recebe:

```
🎯 ALERTA DE PREÇO!

TCL C755 65"
Amazon BR

R$ 3.899,99

Economia: R$ 100,01 (2.5% abaixo)

[Ver Produto] ← Botão clicável!
```

---

## Dúvidas Frequentes

### Meu tópico é privado?

**Sim!** Apenas quem sabe o nome do tópico pode ver as mensagens. Por isso escolha um nome único.

### Precisa de internet?

Sim, tanto o servidor Next.js quanto o celular precisam estar online.

### Funciona com Vercel?

**Sim!** Funciona perfeitamente após deploy.

### Posso usar meu próprio servidor?

Sim! ntfy é open source. Você pode hospedar: https://docs.ntfy.sh/install/

```env
NTFY_SERVER=https://meu-servidor.com
```

### Limites?

Servidor público (ntfy.sh):
- **Sem limites** de mensagens
- **Sem cadastro** necessário
- **Grátis** para sempre

### Email + ntfy juntos?

**Sim!** O sistema envia para ambos simultaneamente. Configure os dois!

---

## Configuração Avançada

### Prioridades

Edite `src/lib/notifier-ntfy.ts`:

```typescript
'Priority': 'urgent',  // urgent, high, default, low, min
```

### Tags (Emojis)

```typescript
'Tags': 'fire,money,tada',  // Vários emojis
```

**Lista completa:** https://docs.ntfy.sh/emojis/

### Sons Personalizados

```typescript
'Click': priceData.url,  // Abre URL ao clicar
'Actions': 'view, Comprar Agora, ' + priceData.url,
```

### Ações Customizadas

```typescript
'Actions': `view, Ver Produto, ${url}; http, Adicionar ao Carrinho, ${cartUrl}, method=POST`,
```

---

## Troubleshooting

### Não recebo notificações

**Checklist:**

1. ✅ App instalado?
2. ✅ Inscrito no tópico correto?
3. ✅ Tópico no `.env.local` está certo?
4. ✅ Teste passou? (`npm run test:ntfy`)
5. ✅ Internet funcionando?
6. ✅ Permissões de notificação ativas?

### "Topic name invalid"

Use apenas:
- Letras (a-z, A-Z)
- Números (0-9)
- Hífens (-)
- Underscores (_)

❌ Errado: `Price Monitor 2025!`
✅ Certo: `price-monitor-2025`

### Servidor próprio não funciona

Certifique-se que o servidor está acessível:

```bash
curl https://seu-servidor.com/health
```

---

## Desinstalar

1. Remova do `.env.local`:
   ```env
   # NTFY_TOPIC=...
   ```

2. No app, clique no tópico → "Delete"

---

## Recursos

- **Documentação:** https://docs.ntfy.sh
- **GitHub:** https://github.com/binwiederhier/ntfy
- **Servidor público:** https://ntfy.sh
- **App Web:** https://ntfy.sh/app

---

## Resumo de 1 Minuto

```bash
# 1. Instale o app ntfy no celular
# 2. Crie tópico: price-monitor-fabio-123
# 3. No app: Subscribe → price-monitor-fabio-123
# 4. No projeto:
echo "NTFY_TOPIC=price-monitor-fabio-123" >> .env.local
# 5. Teste:
npm run test:ntfy
# 6. Pronto! 🎉
```

**Receba alertas instantâneos quando os preços caírem!** 🚀📱
