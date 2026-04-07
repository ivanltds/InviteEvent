# STORY-004-GIFT-LIST: Página e Gestão da Lista de Presentes

## Descrição
Implementação da vitrine de presentes para convidados e do módulo administrativo para gestão dos itens. Foco em visual premium e performance.

## Critérios de Aceitação
1. **Vitrine Pública:** Página `/presentes` com grid de itens estilizado.
2. **Componente de Item:** Exibição de foto (Cloudinary), nome, descrição, preço e status de disponibilidade.
3. **Fluxo de Reserva:** Modal ou botão de confirmação de interesse ("Vou presentear com este item").
4. **Gestão Admin:** Tela `/admin/presentes` para CRUD de itens.
5. **Integração Cloudinary:** Uso de `next-cloudinary` para renderização de fotos.

## Estratégia Técnica
- **Fetch:** Dados simulados (Mock) preparados para futura conexão com Supabase.
- **Server/Client:** Listagem no servidor, interação no cliente.
- **Styles:** CSS Modules mantendo a identidade visual editorial.

## QA Scenarios
- [ ] Validar renderização de imagens do Cloudinary.
- [ ] Validar fluxo de reserva (mudança de estado local).
- [ ] Validar CRUD administrativo (Add/Edit/Remove).

## Status: DONE 🏆
