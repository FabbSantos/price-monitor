# ⚡ Quick Start - 5 Minutos

Siga estes passos para ter o monitor funcionando em **5 minutos**:

## 1️⃣ Instale as dependências (1 min)

```bash
npm install
```

## 2️⃣ Configure o email (2 min)

### Opção A: Setup Automático

```bash
node scripts/setup.js
```

Responda as perguntas interativamente.

### Opção B: Setup Manual

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app
EMAIL_TO=destinatario@gmail.com
CHECK_INTERVAL=30
```

**Para Gmail:**
1. Acesse https://myaccount.google.com/apppasswords
2. Gere uma senha de APP
3. Use essa senha no `EMAIL_PASS`

## 3️⃣ Configure URLs dos produtos (1 min)

Edite `config/products.json` e adicione URLs reais:

```json
{
  "products": [
    {
      "id": "tcl-c755-65",
      "name": "TCL C755 65\"",
      "targetPrice": 4000,
      "urls": {
        "amazon": "https://www.amazon.com.br/dp/SEU_PRODUTO_ID_AQUI"
      }
    }
  ]
}
```

> **Dica**: Você pode desabilitar lojas que não quer monitorar:
> ```json
> { "id": "mercadolivre", "enabled": false }
> ```

## 4️⃣ Teste a configuração (30 seg)

```bash
# Teste o email
node scripts/test-email.js
```

Se receber o email de teste, está tudo certo! ✅

## 5️⃣ Rode o projeto (30 seg)

```bash
npm run dev
```

Acesse: **http://localhost:3000**

Clique no botão **"Atualizar"** para fazer a primeira checagem.

---

## 🎉 Pronto!

Agora o sistema vai:
- ✅ Monitorar preços automaticamente a cada 30 min
- ✅ Mostrar na interface com atualização em tempo real
- ✅ Enviar email quando preço atingir o alvo
- ✅ Salvar histórico para análise

## 🚀 Deploy na Vercel (Opcional)

Para rodar 24/7 na nuvem:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel!

---

## 🆘 Problemas?

- **Preço não encontrado**: Verifique se a URL é da página do produto (não de busca)
- **Email não enviado**: Use senha de APP, não a senha normal
- **Site bloqueou**: Aumente o intervalo para 60 minutos

Leia o [README.md](README.md) completo para mais detalhes!
