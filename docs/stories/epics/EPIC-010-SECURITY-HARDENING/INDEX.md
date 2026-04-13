# EPIC-010: Security Hardening & Data Integrity

## Status: 🟡 IN_PROGRESS (7/11 DONE)

## Descrição
Este épico foca em transformar a segurança por "obscuridade" em segurança de nível profissional, protegendo os dados dos noivos e convidados através de autenticação robusta, ofuscação de identificadores e controle rigoroso de acesso.

## Histórias (Stories)
- [x] **STORY-039:** Migração para Supabase Auth & Vínculo de Propriedade. -> **✅ DONE** (Login via `signInWithPassword`, cookie session, claim automático)
- [x] **STORY-027:** Autenticação Server-Side para Admin (Proteção Real). -> **⚠️ DONE (com ressalva)** (Lógica implementada em `proxy.ts`, **precisa renomear para `middleware.ts`**)
- [x] **STORY-028:** Ofuscação de Slugs de Convite (Anti-Guessing). -> **✅ DONE**
- [x] **STORY-029:** Auditoria e Refinamento de RLS (Supabase). -> **✅ DONE** (23 migrations com RLS multi-tenant aplicadas)
- [x] **STORY-030:** Uploads Assinados para Cloudinary (Signed Uploads). -> **✅ DONE** (Substituída por STORY-044)
- [ ] **STORY-031:** Proteção contra Spam e Rate Limiting no RSVP. -> **📋 BACKLOG**
- [x] **STORY-032:** Admin UX & Security Emergency Refinement. -> **✅ DONE**
- [x] **STORY-036:** Restrição de Acesso ao RSVP (Privacy First). -> **✅ DONE**
- [x] **STORY-044:** Uploads Assinados e Proteção de Mídia (Cloudinary). -> **✅ DONE** (Rota `/api/media/sign` implementada)
- [ ] **STORY-053:** Testes E2E do Fluxo Core de RSVP. -> **📋 TODO**
- [ ] **STORY-054:** Code Quality Cleanup (Console Logs + Error Boundaries). -> **📋 TODO**

## Notas de Arquitetura
- ~~Migração de `process.env.NEXT_PUBLIC_ADMIN_PASSWORD`~~ ✅ Removida — substituída por Supabase Auth.
- Uso de `middleware.ts` do Next.js para controle de sessão. (**⚠️ Arquivo ainda nomeado `proxy.ts` — PENDENTE renomear**)
- Implementação de algoritmos de hashing curto para slugs (nanoid ou hashids). ✅ Implementado.
