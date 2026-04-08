# EPIC-005: Gestão de Estoque, Pagamentos e UX de Presentes

## Status: 🟢 DONE

## Descrição
Este épico foca na robustez do sistema de presentes, integrando pagamentos via PIX, controle real de estoque (atômico) e melhorias de acessibilidade para convidados.

## Histórias (Stories)
- [x] **STORY-016:** Gestão de Status de Presentes (Admin) -> **DONE**
- [x] **STORY-018:** Gestão de "estoque" de presentes (quantidade_total) -> **DONE**
- [x] **STORY-019:** Fluxo de Pagamento via PIX (anexar comprovante) -> **DONE**
- [x] **STORY-020:** Acesso Público à Lista de Presentes (UX Híbrida) -> **DONE**
- [x] **STORY-038:** Edição de Quantidade e Detalhes de Presentes (Admin) -> **DONE**

## QA Results
- **STORY-016:** PASS (Painel Admin de Status OK)
- **STORY-018:** PASS (Atomicidade via RPC validada)
- **STORY-019:** PASS (Upload Cloudinary + RLS OK)
- **STORY-020:** PASS (Links Hero/Navbar/Redirect OK)

## Notas de Arquitetura
- Uso de Supabase RPC para atomicidade no estoque.
- Integração com Cloudinary para comprovantes.
- RLS habilitado em todas as tabelas relacionadas.
