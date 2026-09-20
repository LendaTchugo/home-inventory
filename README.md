# Home Inventory

App pessoal de Android (Expo / React Native) para gerir o inventário de casa a partir das faturas do supermercado.

## O que faz

- **Scan de faturas**: tira uma foto da fatura, a Claude (API da Anthropic, visão multimodal) interpreta os artigos, quantidades e preços.
- **Associação ao inventário**: cada artigo da fatura é associado a uma categoria do inventário (com sugestão automática por nome), com um multiplicador definido por compra (ex: "1x Maionese" pode valer 400g).
- **Entrada manual**: adicionar produtos ao inventário sem precisar de fatura.
- **Inventário**: lista de itens canónicos (nome, unidade — `un`/`g`/`L` — e quantidade em stock), com criar/editar/eliminar e uma ação de "Usar" (por quantidade ou percentagem), com aviso se o stock for insuficiente.
- **Refeições**: definir uma refeição como um conjunto de itens do inventário; "Usar Refeição" mostra uma checklist para confirmar o que foi mesmo usado antes de descontar do stock.
- **Lista de compras**: separador dedicado com um mínimo configurável por item, mostrando o que está a acabar.
- **Estatísticas**: total gasto (tudo e no mês atual) e itens mais comprados, agrupados por unidade.
- **Dados partilhados**: inventário, histórico e refeições vivem numa base de dados Supabase partilhada, para usar em mais do que um telemóvel ao mesmo tempo.

## Stack técnica

- [Expo](https://expo.dev/) SDK 57 + [expo-router](https://docs.expo.dev/router/introduction/) (routing por ficheiros)
- [Anthropic Claude](https://www.anthropic.com/) (API de mensagens, multimodal) chamada diretamente do cliente via `fetch`
- [Supabase](https://supabase.com/) (Postgres + REST/PostgREST) também via `fetch` direto, sem SDK
- [EAS Build](https://docs.expo.dev/build/introduction/) para gerar o `.apk` standalone e [EAS Update](https://docs.expo.dev/eas-update/introduction/) para publicar alterações de JS sem novo build

## Estrutura

```
app/(tabs)/       ecrãs: Scan, Inventário, A Comprar, Histórico, Estatísticas
components/       componentes reutilizáveis (botões, campos, refeições)
lib/dados.js      camada de acesso a dados (Supabase via fetch)
lib/categorias.js sugestão automática de categoria por nome
lib/tema.js       paleta de cores da app
```

## Configuração local

Cria um ficheiro `.env` na raiz com:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=...
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Depois:

```bash
npm install
npx expo start -c
```
