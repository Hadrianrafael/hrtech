-- Papel restrito usado pela aplicação em TODAS as transações (via set_config('role', 'hrtech_rls', true)).
--
-- Motivo: em bancos gerenciados (Neon, Supabase, Azure...) o usuário de conexão costuma ter BYPASSRLS ou ser
-- dono das tabelas. Trocando para um papel sem BYPASSRLS e que não é dono das tabelas, as políticas de
-- Row-Level Security valem sempre, independentemente dos atributos do usuário de login.
--
-- Requer que o usuário que executa as migrations tenha CREATEROLE. Sem essa permissão a migration apenas
-- registra um aviso: a aplicação detecta a ausência do papel e passa a depender dos atributos do usuário de
-- login (o painel /admin mostra o alerta).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hrtech_rls') THEN
    CREATE ROLE hrtech_rls NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  EXECUTE format('GRANT hrtech_rls TO %I', current_user);
EXCEPTION WHEN insufficient_privilege OR duplicate_object THEN
  RAISE NOTICE 'Não foi possível criar/conceder o papel hrtech_rls (%). O RLS dependerá do usuário do banco.', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hrtech_rls') THEN
    GRANT USAGE ON SCHEMA public TO hrtech_rls;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hrtech_rls;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hrtech_rls;
    -- Tabelas/sequências criadas por migrations futuras (executadas pelo mesmo usuário) herdam as permissões.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hrtech_rls;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO hrtech_rls;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Não foi possível conceder permissões ao papel hrtech_rls (%).', SQLERRM;
END $$;
