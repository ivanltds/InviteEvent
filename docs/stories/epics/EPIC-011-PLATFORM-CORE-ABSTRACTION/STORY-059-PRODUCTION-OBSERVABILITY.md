# STORY-059: Observabilidade em Produção (Vercel Analytics + DB Monitoring)

## Descrição
Como proprietário da plataforma, desejo visibilidade sobre o comportamento real dos usuários e do banco de dados em produção, para identificar problemas proativamente e entender o uso real do produto.

## Contexto (Retro — @architect + @data-engineer)
> @architect (Aria): "Recomendo investir em observabilidade (Vercel Analytics) depois do Go-Live."
> @data-engineer: "A função `reservar_presente_v1` usa `SELECT FOR UPDATE` para concorrência — isso é bom, mas precisa de monitoring em produção."

## Critérios de Aceitação

### 1. Vercel Analytics / Speed Insights
- Habilitar **Vercel Analytics** no projeto (gratuito no plano Hobby)
- Habilitar **Vercel Speed Insights** para monitorar Core Web Vitals
- Confirmar que `/inv/[slug]` e `/presentes` têm métricas de LCP < 2.5s

### 2. Supabase Monitoring
- Configurar alertas no Supabase Dashboard para:
  - Erros de RLS (políticas negadas com frequência incomum)
  - Tempo de resposta de queries > 1s
  - Uso de conexões próximo ao limite
- Revisar o log da função `reservar_presente_v1` para race conditions

### 3. Error Tracking (opcional — MVP+)
- Configurar **Sentry** para capturar exceções JavaScript em produção
- Ou usar o log nativo do Vercel (já disponível gratuitamente)

## Prioridade: 🟢 Baixa (pós Go-Live)
## Esforço: S (2-3h)
## Status: 📋 BACKLOG
## Epic: EPIC-011 (Platform Core)

## Dependências
- ⚠️ STORY-051 (Deploy Vercel) — precisa do projeto no ar primeiro
