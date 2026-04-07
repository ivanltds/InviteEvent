# EPIC-010: Security Hardening & Data Integrity

## Status: ⚪ Draft

## Descrição
Este épico foca em transformar a segurança por "obscuridade" em segurança de nível profissional, protegendo os dados dos noivos e convidados através de autenticação robusta, ofuscação de identificadores e controle rigoroso de acesso.

## Histórias (Stories)
- [ ] **STORY-027:** Autenticação Server-Side para Admin (Proteção Real).
- [ ] **STORY-028:** Ofuscação de Slugs de Convite (Anti-Guessing).
- [ ] **STORY-029:** Auditoria e Refinamento de RLS (Supabase).
- [ ] **STORY-030:** Uploads Assinados para Cloudinary (Signed Uploads).
- [ ] **STORY-031:** Proteção contra Spam e Rate Limiting no RSVP.

## Notas de Arquitetura
- Migração de `process.env.NEXT_PUBLIC_ADMIN_PASSWORD` para variáveis privadas no servidor.
- Uso de `middleware.ts` do Next.js para controle de sessão.
- Implementação de algoritmos de hashing curto para slugs (nanoid ou hashids).
