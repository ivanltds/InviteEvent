# Epic: Fase 3 - Inteligência de Dados e Gestão Nominal

## Status: IN PROGRESS 🚀
**Objetivo:** Transformar dados brutos de RSVP em informações operacionais para os noivos e fornecedores, permitindo controle individualizado por membro da família.

## User Stories
| ID | Título | Status | Prioridade |
|----|--------|--------|------------|
| ADMIN-09 | Dashboard Consolidado de Presença | Ready | Alta |
| ADMIN-10 | Gestão Nominal de Membros (Família) | Done ✅ | Alta |
| ADMIN-11 | Exportação de Lista Operacional (CSV) | Ready | Média |
| ADMIN-12 | Monitor de Restrições Alimentares | Ready | Baixa |

## Mudanças de Arquitetura
- Inclusão da tabela `convidados_membros`.
- Agregações dinâmicas no SQL para contagem de "bocas" (pessoas reais) vs. "convites".
