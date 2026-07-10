# Seculos Eletronicos

Sistema de gestão de loja de eletrónicos (vendas, custos, lucros, despesas).

## Stack

- Next.js 16 + React 19
- Drizzle ORM + SQLite (local) / Turso
- shadcn/ui + Tailwind 4
- Auth JWT (admin / user)

## Setup

```bash
pnpm install
pnpm migrate
pnpm dev
```

Login inicial:
- **utilizador:** `admin`
- **senha:** `admin123`

## Variáveis (`.env.local`)

```
TURSO_DATABASE_URL=file:local.db
TURSO_AUTH_TOKEN=local-dev-token
SESSION_SECRET=altere-em-producao
```

Para Turso em produção, use a URL remota e o token reais.

## Funcionalidades

- **Vendas** — produto/serviço, qtd, preço, total, custo, lucro (+ cliente, categoria, pagamento)
- **Despesas** — custos operacionais (admin)
- **Estatísticas** — faturamento, margem, lucro líquido (admin)
- **Utilizadores** — gestão de contas (admin)
- **Conta** — alterar senha
