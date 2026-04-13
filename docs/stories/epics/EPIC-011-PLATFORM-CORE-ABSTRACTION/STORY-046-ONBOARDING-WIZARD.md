# STORY-046: Onboarding Wizard Multi-Step (Refined)

## Descrição
Como um novo organizador, desejo um assistente de configuração (Wizard) que me guie pelos passos essenciais de criação do site, garantindo que eu não precise de suporte técnico para configurar meu casamento.

## Requisitos Detalhados
1. **Passo 1 - Identidade (Obrigatório):**
   - Inputs: Nome da Noiva, Nome do Noivo, Data do Casamento (Datepicker), Slug da URL.
   - Validação: Slug deve ser único e conter apenas letras, números e hifens.
2. **Passo 2 - Identidade Visual (Opcional):**
   - Color Pickers: Fundo, Texto e Destaque.
   - Selects: Fonte Cursiva e Fonte Serifada (com preview de texto vivo).
3. **Passo 3 - Protagonistas (Opcional):**
   - Dropzone: Foto da Noiva e Foto do Noivo.
   - Integração: Upload assinado Cloudinary em tempo real.
4. **Passo 4 - Capa & Atmosfera (Opcional):**
   - Upload Múltiplo: Até 5 fotos para o carrossel Hero.
5. **Persistência:** O progresso deve ser salvo no `localStorage` e no banco de dados a cada passo ("save-on-next").

## Critérios de Aceitação (QA)
- [ ] GIVEN um slug existente WHEN o usuário digita THEN mostrar erro "Endereço indisponível".
- [ ] GIVEN o passo 3 WHEN o usuário sobe foto THEN a imagem deve aparecer no preview instantaneamente.
- [ ] GIVEN a conclusão do wizard THEN marcar `onboarding_completed = true` no banco.

## Status: ✅ DONE 🏆

## Notas de Implementação
- `OnboardingWizard.tsx` + `OnboardingWizard.module.css` implementados
- Integrado ao Dashboard como CTA para novos eventos
- Migration `add_onboarding_fields.sql` aplicada
