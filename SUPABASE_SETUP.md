# Setup do Supabase

Este documento explica como configurar o banco de dados Supabase para persistência de dados.

## 1. Execute o Schema SQL

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto: `supabase-fuchsia-dog`
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie e cole todo o conteúdo do arquivo `supabase/schema.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

O schema criará 3 tabelas:
- `price_checks` - Armazena timestamp da última verificação
- `current_prices` - Preços atuais de cada produto/loja
- `price_history` - Histórico de mudanças de preço (>5%)

## 2. Verifique as Tabelas

No menu lateral, vá em **Table Editor**. Você deve ver:
- ✅ price_checks (1 linha)
- ✅ current_prices (vazia inicialmente)
- ✅ price_history (vazia inicialmente)

## 3. Variáveis de Ambiente

Certifique-se que o `.env.local` contém:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qwkvwywoiygwfwgobxlg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**IMPORTANTE**: Ao fazer deploy na Vercel, adicione essas variáveis nas configurações do projeto!

## 4. Como Funciona

### Fluxo de Dados:

```
Cron (cron-job.org a cada 15min)
  ↓
POST /api/scrape
  ↓ Faz scraping de todas lojas
  ↓ Salva no Supabase
  ↓ Envia notificações ntfy

Frontend (usuário abre página)
  ↓
GET /api/prices
  ↓ Busca dados do Supabase
  ↓ Exibe preços + histórico

Frontend (polling a cada 30s)
  ↓
GET /api/prices
  ↓ Busca novos dados
  ↓ Atualiza interface se houver mudanças
```

### Vantagens:

1. **Persistência**: Dados não se perdem ao recarregar página
2. **"Última atualização" real**: Vem do banco, não do estado local
3. **Histórico funcional**: Registra mudanças de preço (>5%)
4. **Cron funciona**: Frontend vê atualizações do cron via polling
5. **Serverless-friendly**: Não depende de sistema de arquivos

### Dados Armazenados:

**Mínimo possível para economizar espaço:**
- Apenas preços atuais (UPSERT)
- Histórico só quando muda >5%
- Timestamps compactos
- Sem dados duplicados

## 5. Monitoramento

Para ver os dados no Supabase:

1. **Table Editor** → Visualiza dados
2. **SQL Editor** → Execute queries:

```sql
-- Ver última verificação
SELECT * FROM price_checks;

-- Ver preços atuais
SELECT * FROM current_prices ORDER BY checked_at DESC;

-- Ver histórico
SELECT * FROM price_history ORDER BY checked_at DESC LIMIT 50;

-- Ver mudanças por produto
SELECT
  product_id,
  store,
  COUNT(*) as mudancas,
  MIN(price) as menor_preco,
  MAX(price) as maior_preco
FROM price_history
GROUP BY product_id, store;
```

## 6. Limpeza de Dados (Opcional)

Para limpar dados antigos e economizar espaço:

```sql
-- Remove histórico com mais de 60 dias
DELETE FROM price_history
WHERE checked_at < NOW() - INTERVAL '60 days';
```

## 7. Backup (Opcional)

O Supabase free tier não tem backups automáticos. Para backup manual:

1. SQL Editor → Export
2. Ou use `pg_dump`:

```bash
pg_dump "postgres://postgres.qwkvwywoiygwfwgobxlg:wU6gaj1it643XG7g@aws-1-us-east-1.pooler.supabase.com:5432/postgres" > backup.sql
```
