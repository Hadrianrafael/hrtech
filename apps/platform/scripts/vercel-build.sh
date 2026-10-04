#!/bin/sh
# Build na Vercel: aplica migrations + seed idempotente (somente em produção ou com MIGRATE_ON_BUILD=true)
# e depois gera o build do Next.js.
#
# Migrations usam a conexão DIRETA (sem pooler): DIRECT_URL ou DATABASE_URL_UNPOOLED (criada pela
# integração Neon da Vercel); se nenhuma existir, usa DATABASE_URL.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "✖ DATABASE_URL não configurada. Conecte um banco PostgreSQL ao projeto (Storage → Neon) ou defina a variável."
  exit 1
fi

if [ "$VERCEL_ENV" = "production" ] || [ "$MIGRATE_ON_BUILD" = "true" ]; then
  MIGRATE_URL="${DIRECT_URL:-${DATABASE_URL_UNPOOLED:-$DATABASE_URL}}"
  echo "→ Aplicando migrations"
  DATABASE_URL="$MIGRATE_URL" pnpm prisma migrate deploy
  echo "→ Seed idempotente (planos, papéis, primeiro administrador)"
  DATABASE_URL="$MIGRATE_URL" pnpm db:seed
else
  echo "→ Ambiente '$VERCEL_ENV': migrations não aplicadas (defina MIGRATE_ON_BUILD=true se este ambiente tiver banco próprio)."
fi

pnpm build
