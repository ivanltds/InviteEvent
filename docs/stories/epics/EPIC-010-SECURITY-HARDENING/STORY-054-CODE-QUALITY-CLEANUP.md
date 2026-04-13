# STORY-054: Code Quality Cleanup (Console Logs + Error Boundaries)

## Descrição
Como desenvolvedor, desejo que o código de produção esteja limpo de instrumentação de debug e robusto com Error Boundaries, para garantir uma experiência profissional aos convidados e facilitar diagnóstico real de erros em produção.

## Contexto (Retro — Item 6 + @dev percepção)
> @dev (Dex): "Vários `console.log('[Config]...', '[Galeria]...')` ainda estão no código de produção. Deveriam usar um logger condicional ou serem removidos antes do deploy."
> @dev (Dex): "...adicionar error boundaries nos componentes client..."

## Critérios de Aceitação

### 1. Remoção de Console Logs de Debug
- Remover ou condicionar todos os `console.log()` de debug identificados:
  - `[Config]` em `configuracoes/page.tsx` (~5 ocorrências)
  - `[Galeria]` em `galeria/page.tsx` (~4 ocorrências)
  - `[Galeria]` em `galleryService.ts`
  - Quaisquer outros `console.log` não essenciais
- **Manter:** `console.error()` para erros reais (estes são válidos em produção)
- **Alternativa aceita:** Criar utility `logger.ts` que só loga em `process.env.NODE_ENV === 'development'`

### 2. Error Boundaries nos Componentes Críticos
- Criar componente `ErrorBoundary.tsx` em `src/components/ui/`
- Wrappear os seguintes componentes com ErrorBoundary:
  - `/admin/convidados/page.tsx`
  - `/admin/presentes/page.tsx`
  - `/admin/configuracoes/page.tsx`
  - `/inv/[slug]/page.tsx` (seções de RSVP e Presentes)
- A UI de fallback deve mostrar mensagem amigável sem expor stack trace

### 3. React Key Warnings
- Auditar e corrigir todos os warnings de `key` prop em listas React
- Verificados no build log: múltiplas ocorrências em `<head>`, `<meta>`, listas

## Prioridade: 🟡 Média (antes do deploy)
## Esforço: S (2-3h)
## Status: 📋 TODO
## Epic: EPIC-010 (Security & Quality Hardening)

## Dependências
- Nenhuma — pode ser feita em paralelo com outras stories

## Notas Técnicas
```typescript
// src/lib/utils/logger.ts — solução sugerida
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  error: (...args: unknown[]) => console.error(...args), // sempre logado
};
```

```typescript
// src/components/ui/ErrorBoundary.tsx — uso básico
// Envolver páginas sensíveis para evitar crash total da UI
```
