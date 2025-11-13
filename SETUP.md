# 🚀 Guia Rápido de Setup

## Passo 1: Instalar Dependências

```bash
npm install
```

## Passo 2: Configurar Email

1. Crie o arquivo `.env.local` (já existe um template)
2. Configure com suas credenciais SMTP:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app
EMAIL_TO=destinatario@gmail.com
```

### Como obter senha de app do Gmail:

1. Acesse: https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Acesse "Senhas de app"
4. Selecione "Email" e "Windows Computer"
5. Copie a senha gerada
6. Cole no campo `EMAIL_PASS` do `.env.local`

## Passo 3: Configurar URLs dos Produtos

Edite `config/products.json` com as URLs reais dos produtos que você quer monitorar.

### Como encontrar URLs:

1. Acesse a loja (Amazon, Casas Bahia, etc)
2. Busque pelo produto desejado (ex: "TCL C755 65")
3. Copie a URL completa da página do produto
4. Cole no `config/products.json`

**Exemplo:**

```json
{
  "id": "tcl-c755-65",
  "name": "TCL C755 65\"",
  "targetPrice": 4000,
  "urls": {
    "amazon": "https://www.amazon.com.br/dp/B0XXXXX",
    "casasbahia": "https://www.casasbahia.com.br/produto/123456"
  }
}
```

## Passo 4: Rodar o Projeto

```bash
# Desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## Passo 5: Testar

1. Clique no botão "Atualizar" na interface
2. Aguarde o scraping completar
3. Verifique se os preços aparecem nos cards
4. Se houver erros, veja os logs no terminal

## Problemas Comuns

### ❌ "Preço não encontrado"

**Causa**: URL incorreta ou seletores CSS desatualizados

**Solução**:
1. Verifique se a URL é da página do produto (não de busca)
2. Acesse a URL manualmente e veja se o preço está visível
3. Se o site mudou, atualize os seletores em `src/lib/scrapers/`

### ❌ "Erro ao enviar email"

**Causa**: Credenciais SMTP incorretas

**Solução**:
1. Use senha de APP (não a senha normal)
2. Verifique se a verificação em 2 etapas está ativa
3. Teste com outro provedor SMTP se necessário

### ❌ Site bloqueou o scraper

**Causa**: Anti-bot detectou muitas requisições

**Solução**:
1. Aumente o intervalo de checagem (`CHECK_INTERVAL=60`)
2. Aguarde algumas horas antes de tentar novamente
3. Considere usar proxies ou APIs oficiais

## Next Steps

- ✅ Configure alertas de preço
- ✅ Adicione mais produtos em `config/products.json`
- ✅ Deixe rodando em background
- ✅ Monitore o histórico de preços no gráfico

## Deploy (Opcional)

Para rodar 24/7 na nuvem:

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel!

---

**Pronto para monitorar! 🎉**
