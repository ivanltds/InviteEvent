# STORY-051: Deploy & CI/CD Pipeline (Go-Live)

## Descrição
Como proprietário da plataforma, desejo que o site esteja deployado na Vercel com um pipeline de CI/CD básico, para que cada commit na `main` gere um deploy automático e o convite de Layslla e Marcus esteja acessível online.

## Critérios de Aceitação
1. **Vercel Deploy:** Projeto conectado ao repositório GitHub com deploy automático.
2. **Environment Variables:** Todas as variáveis do `.env.example` configuradas no painel Vercel.
3. **Build Limpo:** `npm run build` deve passar com 0 errors e 0 warnings críticos.
4. **Domínio:** Configurar domínio customizado (se disponível) ou usar subdomínio Vercel.
5. **CI Básico:** GitHub Action que rode `npm run lint` e `npm test` em cada PR.
6. **Smoke Test:** Verificar que `/`, `/admin/login`, `/inv/[slug-teste]` e `/presentes` respondem 200.

## Prioridade: 🔴 Alta (Bloqueador para o casamento)
## Esforço: S (2-4h)
## Status: 📋 TODO

## Dependências
- ⚠️ STORY-055 (Proxy + Build fix) — **BLOQUEADOR**

## Notas Técnicas
- Verificar se `next.config.ts` precisa de `output: 'standalone'` para Vercel
- Configurar preview deployments para branches de feature
