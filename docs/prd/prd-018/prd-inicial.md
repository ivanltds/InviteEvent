# PRD-018: Blindagem de QA & Stress (Enterprise Hardening) 🛡️💎

> **Status:** DESCOBERTA  
> **Responsável:** @ba (Analista de Negócios)  
> **Data:** 16 de Maio de 2026  
> **Fase:** Emergência de Estabilidade v1.5

---

## 1. Problema e Oportunidade
O **InviteEventAI** atingiu a maturidade de funcionalidades (v0.3.10), mas o crescimento acelerado (Roadmap de Conversão) impõe riscos de regressão e falhas sob carga. Identificamos que a "ansiedade de deploy" do Operador e do time pode ser mitigada com uma suíte de testes resiliente que garanta que *nada quebra* enquanto escalamos.

**A oportunidade:** Transformar a plataforma em uma infraestrutura "Enterprise Ready", capaz de suportar centenas de acessos simultâneos em casamentos de grande porte sem degradação de UX.

## 2. Personas Impactadas
- **Noivos (Organizadores):** Precisam de confiança total de que a lista de presentes não falhará no dia do evento.
- **Convidados:** Precisam de um fluxo de compra sem atritos, timeouts ou erros 500.
- **Time de DEV:** Precisa de uma esteira de QA que valide cenários negativos automaticamente.

## 3. Escopo Prioritário (Fase 1.5)

### 3.1. Stress Testing (Concurrency & Race Conditions)
- **Cenário:** 50 convidados tentando "Reservar" o mesmo item simultaneamente.
- **Objetivo:** Validar se os Locks de 3h e a integridade ACID (PostgreSQL) funcionam sem duplicidade ou "venda fantasma".
- **KPI:** 0% de reserva duplicada.

### 3.2. Negative Flow Certification
- **Cenário:** Simulação de timeouts de API, falhas de rede no client e retornos 403/404/500 controlados.
- **Objetivo:** Garantir que o frontend exiba Modais de Erro amigáveis (Design System Gold) em vez de telas brancas ou console errors.
- **KPI:** Cobertura de 100% das rotas críticas com `ErrorBoundary`.

### 3.3. Mobile UX & Swipe Audit
- **Cenário:** Navegação massiva em dispositivos reais (iOS/Android) via emulação Playwright.
- **Objetivo:** Validar se o "Smooth Scroll" e as animações Framer Motion não travam o navegador mobile sob carga de dados.

### 3.4. Security Regression (RLS Protection)
- **Cenário:** Tentativas de acesso não autorizado a dados de outros eventos/organizadores.
- **Objetivo:** Certificar que as políticas de RLS (corrigidas na v0.3.8) permanecem invioláveis.

## 4. O que NÃO entra neste PRD
- Novas funcionalidades de negócio (Viralidade, Kits de Mídia).
- Redesign de telas existentes (apenas ajustes de feedback de erro).
- Migração de infraestrutura de servidor (manter Vercel).

## 5. Critérios de Aceite Iniciais
- [ ] Suíte Playwright capaz de rodar 10 sessões paralelas sem falhas de orquestração.
- [ ] Implementação de Logs de Erro silenciosos (Sentry/Log-layer) para capturar falhas em produção.
- [ ] Validação de que todos os formulários possuem estados de `loading`, `error` e `success` consistentes.

---

## 6. Definições do Operador (Refinamento)
1. **Pico Esperado:** Simular 200 ou mais usuários simultâneos por evento.
2. **Comportamento de Erro:** Priorizar a exibição de mensagens amigáveis e modais de feedback claro quando o sistema detectar lentidão ou falha de rede.
3. **Dispositivos:** Sem lentidões específicas reportadas; manter compatibilidade universal iOS/Android.

---
*Assinado: @ba (Analista de Negócios)*
