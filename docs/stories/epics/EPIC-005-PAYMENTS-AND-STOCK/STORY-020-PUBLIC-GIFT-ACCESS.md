# STORY-020: Acesso Público à Lista de Presentes (UX Híbrida)

## Descrição
Permitir que a lista de presentes seja acessível diretamente via Navbar e Hero, removendo a obrigatoriedade exclusiva do RSVP para visualização, mas mantendo o redirecionamento pós-confirmação como um passo natural do funil.

## Critérios de Aceitação
1. **Link na Navbar:** Adicionar item "Presentes" no menu de navegação.
2. **Botão na Hero:** Adicionar botão secundário "Lista de Presentes" na seção Hero da Home.
3. **Persistência do Funil:** Manter o redirecionamento automático para `/presentes` após um RSVP de confirmação bem-sucedido.
4. **Mensagem Acolhedora:** Adicionar um texto de boas-vindas na página de presentes reforçando que a presença é o mais importante.
5. **Consistência de UX:** Garantir que o modal PIX funcione independentemente de como o usuário chegou à página.

## Contexto de UX (@ux-design-expert)
- **Barreira:** Exigir RSVP antes de ver presentes pode frustrar o convidado.
- **Empatia:** Transparência financeira e facilidade de acesso posterior.

## QA Scenarios
- [ ] Verificar se o link na Navbar leva para `/presentes`.
- [ ] Verificar se o botão na Hero leva para `/presentes`.
- [ ] Confirmar que o RSVP ainda redireciona para a lista ao finalizar.
- Validar visualização em dispositivos móveis (responsividade).

## Status: DONE 🏆
