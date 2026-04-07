# STORY-031: Proteção contra Spam e Rate Limiting no RSVP

## Descrição
Implementar mecanismos de proteção para evitar ataques de força bruta ou inundação de dados falsos (Spam) no formulário de confirmação de presença.

## Critérios de Aceitação
1. **Rate Limiting:** Limitar o número de submissões de RSVP por IP em um determinado intervalo de tempo.
2. **Validação Silenciosa:** Implementar técnicas de honeypot ou integração com Captcha (Turnstile/reCAPTCHA).
3. **Saneamento de Dados:** Garantir que campos de texto (mensagens/restrições) passem por limpeza de scripts maliciosos (XSS).

## Status: Draft
