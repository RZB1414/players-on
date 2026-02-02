# Entendendo o Deploy de Monorepo no Cloudflare

Você está em um projeto **Monorepo**, o que significa que tem múltiplos projetos dentro do mesmo repositório:

1.  **`apps/web`**: Seu site (React/Vite).
2.  **`apps/api`**: Sua API (Cloudflare Worker).
3.  **`packages/shared`**: Código compartilhado.

## O Erro que Aconteceu

O comando `npx wrangler deploy` que você viu falhar estava tentando fazer o deploy de um **Worker** (provavelmente o da raiz ou da API) mas estava confuso sobre onde estavam os arquivos estáticos (`assets`).

## Como "Subir" Corretamente

No Cloudflare, **Sites** (Pages) e **APIs** (Workers) são serviços separados, mesmo que o código viva junto.

### 1. Para o Site (Web) - O Prioritário

O seu site React deve ir para o **Cloudflare Pages**.
*   Ele não usa o comando `wrangler deploy` direto para Workers.
*   A maneira mais fácil é conectar seu GitHub no painel do Cloudflare Pages.

**Configuração do Painel (Cloudflare Pages):**
*   **Build Command:** `npm run build --workspace=apps/web`
*   **Build Output:** `apps/web/dist`
*   **Root Directory:** `/` (Raiz do projeto)

### 2. Para a API (Opcional por enquanto)

Seu arquivo `apps/api/src/index.js` é apenas um exemplo ("Hello World"). Seu site atual **NÃO** depende dessa API (ele fala direto com o YouTube).
Então, você pode simplesmente **ignorar** a pasta `api` por enquanto. Não precisa fazer deploy dela.

## Resumo

Para resolver seu problema agora e colocar o site no ar:

1.  Ignore os erros de `wrangler deploy` local.
2.  Dê o `git push` com as correções que fizemos (`.gitignore`).
3.  Vá no painel do Cloudflare Pages > Create Project > Connect to Git.
4.  Use as configurações acima.

Cloudflare vai baixar o monorepo todo, entrar na pasta certa, construir só o site e publicar.
