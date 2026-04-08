# Projeto Casamento: Backlog Priorizado (Pax - PO)

## Overview
Este backlog contém as histórias de usuário restantes, organizadas por prioridade técnica e de negócio para garantir o sucesso do evento e a segurança dos dados.

---

## 🔝 PRIORIDADE 1: Segurança & Integridade (Hardening)
*Foco: Proteger o admin e os dados dos convidados antes da divulgação em massa.*

1. **[EPIC-010] STORY-027: Autenticação Server-Side para Admin**
   - **Por que:** O `NEXT_PUBLIC_ADMIN_PASSWORD` é inseguro. Precisamos de proteção via Middleware e Cookies seguros.
   - **Status:** Draft → Ready for Dev

2. **[EPIC-010] STORY-029: Auditoria e Refinamento de RLS (Supabase)**
   - **Por que:** Garantir que convidados não possam ler dados de outros convidados via API.
   - **Status:** Draft

3. **[EPIC-010] STORY-030: Uploads Assinados para Cloudinary**
   - **Por que:** Evitar que qualquer pessoa com a URL de upload possa injetar lixo na conta do casal.
   - **Status:** Draft

4. **[EPIC-010] STORY-031: Proteção contra Spam no RSVP**
   - **Por que:** Evitar bots ou scripts maliciosos de saturarem o banco com registros falsos.
   - **Status:** Draft

---

## ⚡ PRIORIDADE 2: Experiência & Funcionalidades (UX/Features)
*Foco: Valor percebido pelo convidado e organização logística.*

5. **[EPIC-007] STORY-035: Refinamento de UX & Preview Visual no Admin**
   - **Por que:** Melhorar a confiança do usuário ao configurar as cores e fontes com preview real-time.
   - **Status:** DONE 🏆

5. **[EPIC-009] STORY-029: Galeria de Fotos Interativa**
   - **Por que:** É o recurso visual mais esperado após o RSVP. Layout Pinterest/Masonry.
   - **Status:** Draft

6. **[EPIC-008] STORY-028: Gestão de Múltiplos Eventos (Agenda)**
   - **Por que:** Casamentos costumam ter pré-chás ou ensaios. Organizar isso em uma timeline é vital.
   - **Status:** Draft

---

## 🚀 PRIORIDADE 3: Evolução de Plataforma (Escalabilidade)
*Foco: Transformar o sistema em "Event-as-a-Service".*

7. **[EPIC-011] STORY-032: Migração para Multi-tenancy**
   - **Por que:** Permitir que o motor rode mais de um casamento simultaneamente.
   - **Status:** Draft

8. **[EPIC-011] STORY-033: Abstração via Metadados (JSONB)**
   - **Por que:** Flexibilidade para diferentes tipos de festas sem mudar o schema SQL.
   - **Status:** Draft

9. **[EPIC-011] STORY-034: Feature Flags por Evento**
   - **Por que:** Ativar/desativar galeria ou lista de presentes individualmente por evento.
   - **Status:** Draft

---

## 📋 Resumo do Estado Atual
- **Epics Finalizados:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007.
- **Próximo Passo Imediato:** Iniciar STORY-027 (Server-side Auth).
