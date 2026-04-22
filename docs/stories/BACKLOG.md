# Projeto InviteEventAI: Backlog Priorizado

**Última atualização:** 11/04/2026 por Pax (PO) — *backlog-prioritize*
**Casamento:** 13/06/2026 (restam ~63 dias)

> **Critérios de priorização (Pax):**
> 1. 🔒 **Bloqueio técnico:** A story impede outras de avançar?
> 2. 🎁 **Valor para o convidado:** Impacta a experiência do usuário final diretamente?
> 3. 🔴 **Risco de negócio:** A ausência causa dano real (segurança, dados, reputação)?
> 4. 📅 **Prazo:** 63 dias — prioridade absoluta ao que é necessário para convidar os guests.

---

## 🔴 SPRINT 1 — "Go-Live" (Prioridade Máxima)
> **Meta:** Site no ar com segurança + experiência visual digna do casamento.
> **Janela ideal:** Esta semana.

| Pos. | Story | Motivo da Priorização | Esforço | Dependência |
|------|-------|----------------------|---------|------------|
| **1** | ✅ **STORY-055** — Proxy + Fix Build | **Bloqueador absoluto.** Sem build funcional nada vai ao ar. Rotas admin abertas = risco de segurança real. | XS | — |
| **2** | 🐞 **STORY-058** — [BUG] Contraste Admin | **Bug visual crítico.** Organizador usa o admin intensamente; ilegibilidade compromete a experiência de configuração. Mais simples de resolver. | S | Paralela com 055 |
| **3** | 🔤 **STORY-057** — Font Picker Premium | **Personalização típica = orgulho do noivo.** Fontes cursivas exageradas são o item mais pedido. Depende do admin legível (058). | M | Após 058 |
| **4** | 🌟 **STORY-056** — Envelope Gateway (Animação) | **WOW factor do convite.** A abertura do envelope é o momento que o convidado vai lembrar e compartilhar. | L | Após 055 |
| **5** | 🎨 **STORY-052** — Visual Premium do Convite | **Acabamento do produto.** Tipografia, paleta, monograma — tudo que faz o convite parecer profissional. | L | Paralela com 056 |
| **6** | 🖼️ **STORY-050** — Galeria Pública de Fotos | **Val. direto ao convidado.** Admin já tem galeria pronta; falta apenas exposição pública. Recurso emocional importante. | M | Paralela com 052 |
| **7** | 🚀 **STORY-051** — Deploy & CI/CD (Vercel) | **Pré-requisito do Go-Live.** Sem isso o site não é acessível. CI/CD evita regressões futuras. | S | Após 055 |
| **8** | 🐞 **STORY-060** — Bugfix Marathon & External Links | **Qualidade & Features.** Correção de bugs críticos de visualização, data e esquema + funcionalidade de link externo. | L | STORY-055 |

---

## 🟡 SPRINT 2 — "Qualidade & Confiança" (Alta Importância)
> **Meta:** Garantir robustez, prevenir regressões e preparar para crescimento orgânico.
> **Janela:** Após Go-Live inicial.

| Pos. | Story | Motivo da Priorização | Esforço | Dependência |
|------|-------|----------------------|---------|------------|
| **5** | 🧹 **STORY-054** — Code Quality Cleanup | Boas práticas antes que mais pessoas usem o sistema. Console logs expõem informações em DevTools. Error boundaries evitam crash visível ao convidado. | S | Após 051 |
| **6** | 🧪 **STORY-053** — E2E Tests RSVP Flow | Garante que nenhuma mudança futura quebre o fluxo de confirmação de presença — o *core loop* do produto. | M | Após 054 e CI on |
| **7** | 🛡️ **STORY-031** — Spam/Rate Limiting RSVP | Proteção importante, mas não urgente para o casamento de Layslla: lista de convidados é fechada e convites são privados (slug ofuscado). | M | — |

---

## 🟢 SPRINT 3 — "Evolução da Plataforma" (Backlog Futuro)
> **Meta:** Expandir o InviteEventAI como produto SaaS além do primeiro casamento.
> **Janela:** Pós 13/06/2026 ou conforme banda disponível.

| Pos. | Story | Motivo da Priorização | Dependência |
|------|-------|----------------------|------------|
| **8** | 📊 **STORY-059** — Observabilidade (Vercel Analytics) | Visibilidade do comportamento real em produção. Importante para decisões de produto, mas não urgente. | Após 051 |
| **9** | 🧩 **STORY-033** — Abstração JSONB de Entidades | Evolução da plataforma para suportar além de casamentos (aniversários, chás de bebê). Pós-MVP. | — |
| **10** | 🚩 **STORY-034** — Feature Flags por Evento | Controle granular de recursos por tenant. Alta complexidade, baixa urgência no estágio atual. | Após 033 |

---

## 📌 Stories DONE (Referência)

> Listadas para rastreabilidade. Não reabrir sem justificativa formal.

| Story | Descrição | Épico |
|-------|-----------|-------|
| STORY-039 | Migração Supabase Auth | EPIC-010 |
| STORY-027 | Auth Server-Side *(ressalva: proxy renomear → resolvida por 055)* | EPIC-010 |
| STORY-028 | Ofuscação de Slugs | EPIC-010 |
| STORY-029 | Auditoria RLS | EPIC-010 |
| STORY-030 | Signed Uploads *(substituída por 044)* | EPIC-010 |
| STORY-032 | Admin UX & Security + Gestão de Equipe | EPIC-010/011 |
| STORY-036 | Restrição de Acesso ao RSVP | EPIC-010 |
| STORY-044 | Uploads Assinados Cloudinary | EPIC-010 |
| STORY-037 | Landing Page & Abstração de Rotas | EPIC-011 |
| STORY-041 | Dashboard Consolidado de Eventos | EPIC-011 |
| STORY-042 | Fluxo de Criação de Novo Casamento | EPIC-011 |
| STORY-046 | Onboarding Wizard Multi-Step | EPIC-011 |
| STORY-047 | Navegação em Camadas | EPIC-011 |
| STORY-048 | Dashboard de Métricas do Evento | EPIC-011 |
| STORY-055 | Proxy + Fix Build (Antigo 049) | EPIC-010 |

---

## 📊 Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Stories DONE | **20** |
| Sprint 1 — Go-Live | **7** stories (055, 058, 057, 056, 052, 050, 051) |
| Sprint 2 — Qualidade | **3** stories (054, 053, 031) |
| Sprint 3 — Plataforma | **3** stories (059, 033, 034) |
| Total stories ativas | **13** |
| Build status | ✅ FIXED via STORY-055 |
| Deploy status | ❌ NOT DEPLOYED → **Fix: STORY-051** |
| Prazo crítico | ⏰ **13/06/2026** |

> **Nota @ux (Uma):** Sprint 1 agora inclui a experiência completa do convidado — envelope, fontes, visual e galeria. A ordem de implementação dentro do sprint deve seguir: `055 → 058 → 057 → [056 + 052 + 050 paralelas] → 051`

---

## 🔄 Revisão de Prioridades — Decisões do PO

### ↑ Subiu na priorização
- **STORY-052** (Visual Premium): movida de "após deploy" para **paralela ao Sprint 1**. Justificativa: o convite é o produto visível ao convidado. Deve estar pronto junto com o deploy.
- **STORY-050** (Galeria Pública): movida para **Sprint 1**. O admin já tem galeria; a exposição pública tem alto valor emocional para os convidados e baixo risco de implementação.

### ↓ Desceu na priorização
- **STORY-054** (Code Cleanup): movida de "paralela ao sprint" para **Sprint 2**. Justificativa: console.logs e error boundaries não impedem o Go-Live e não afetam a experiência do convidado em produção. São tech debt gerenciável.
- **STORY-053** (E2E Tests): movida para **Sprint 2**. Justificativa: testes E2E dependem de CI/CD estar on. Não faz sentido antes do deploy.

### = Mantida
- **STORY-055**: permanece #1 absoluta — bloqueador de tudo.
- **STORY-051**: permanece após 055 — pré-requisito de acesso público.
- **STORY-031, 033, 034, 059**: permanecem em backlog futuro — baixo impacto no prazo.

---

*— Pax, equilibrando prioridades 🎯*
