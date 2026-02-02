# Guia de Deploy - Cloudflare Pages

Este projeto é um **Monorepo** usando **Vite**. Abaixo estão as configurações exatas para configurar seu projeto no Cloudflare Pages.

## 1. Conectando ao Git

Ao criar um novo projeto no Cloudflare Pages e conectar seu repositório Git, use as seguintes configurações de build:

| Configuração | Valor |
| --- | --- |
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build --workspace=apps/web` |
| **Build Output Directory** | `apps/web/dist` |
| **Root Directory** | `/` (Deixe em branco ou padrão) |

> **Nota:** É importante manter o *Root Directory* como a raiz do repositório (não mude para `apps/web`) para que o NPM consiga instalar as dependências do monorepo corretamente.

## 2. Variáveis de Ambiente

Você **PRECISA** configurar as seguintes variáveis de ambiente no painel do Cloudflare Pages (Settings -> Environment variables):

*   `VITE_YOUTUBE_API_KEY`: (Sua chave da API do YouTube)
*   `VITE_YOUTUBE_CHANNEL_ID`: (O ID do canal do YouTube)

Você pode encontrar os valores atuais no arquivo `apps/web/.env`.

## 3. Arquivos Importantes Criados

*   **`apps/web/public/_redirects`**: Criado para garantir que o roteamento (se houver no futuro) funcione corretamente, redirecionando todas as requisições para o `index.html`.
*   **`apps/web/.env.example`**: Exemplo das variáveis necessárias.

## 4. Testando o Build Localmente

Para garantir que tudo está funcionando antes de enviar, você pode rodar o comando de build na raiz do projeto:

```powershell
npm run build --workspace=apps/web
```

Se o comando finalizar com sucesso (pasta `apps/web/dist` gerada), o projeto está pronto para deploy.
