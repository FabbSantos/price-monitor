-- Função RPC para buscar last_check sem cache
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_last_check()
RETURNS TABLE (
  id integer,
  last_check timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, last_check, created_at
  FROM price_checks
  WHERE id = 1
  LIMIT 1;
$$;

-- Garante que a função pode ser chamada por todos
GRANT EXECUTE ON FUNCTION get_last_check() TO anon, authenticated, service_role;

-- Comentário explicativo
COMMENT ON FUNCTION get_last_check() IS 'Retorna o registro de last_check sem usar cache do query builder';
