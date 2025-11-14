-- Schema para Price Monitor
-- Execute este SQL no Supabase SQL Editor

-- Tabela para rastrear a última verificação
CREATE TABLE IF NOT EXISTS price_checks (
  id BIGSERIAL PRIMARY KEY,
  last_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante que só existe 1 linha (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS price_checks_singleton ON price_checks ((1));

-- Insere a primeira linha
INSERT INTO price_checks (id, last_check)
VALUES (1, NOW())
ON CONFLICT DO NOTHING;

-- Tabela para preços atuais (última verificação)
CREATE TABLE IF NOT EXISTS current_prices (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  store VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2),
  available BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Índice único para UPSERT por produto+loja
  UNIQUE(product_id, store)
);

-- Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_current_prices_product ON current_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_current_prices_checked ON current_prices(checked_at DESC);

-- Tabela para histórico de preços (apenas mudanças significativas >5%)
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  store VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para queries de histórico
CREATE INDEX IF NOT EXISTS idx_history_product_store ON price_history(product_id, store, checked_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_current_prices_updated_at
  BEFORE UPDATE ON current_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - permite leitura pública
ALTER TABLE price_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um pode ler, só service_role pode escrever
CREATE POLICY "Enable read access for all users" ON price_checks FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON current_prices FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON price_history FOR SELECT USING (true);

-- Comentários para documentação
COMMENT ON TABLE price_checks IS 'Armazena timestamp da última verificação de preços';
COMMENT ON TABLE current_prices IS 'Armazena os preços atuais de cada produto em cada loja';
COMMENT ON TABLE price_history IS 'Armazena histórico de mudanças de preço (>5%)';
