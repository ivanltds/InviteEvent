# STORY-019: Fluxo de Pagamento via PIX

## Descrição
Implementação do fluxo de contribuição financeira via PIX para os itens da lista de presentes, com upload de comprovante para validação posterior.

## Critérios de Aceitação
1. **Configuração PIX:** Campos no Admin para definir chave, banco e nome do beneficiário.
2. **Modal de Instruções:** Exibir dados do PIX ao clicar em "Presentear" na vitrine.
3. **Upload de Comprovante:** Botão integrado com Cloudinary para envio da imagem do comprovante.
4. **Persistência de Prova:** Salvar URL do comprovante na nova tabela `comprovantes` vinculada ao presente e convidado.

## Estratégia Técnica
- Uso de `CldUploadWidget` da `next-cloudinary`.
- Criação da tabela `comprovantes` com RLS.
- Uso de Supabase RPC para garantir atomicidade no processo de reserva + log de comprovante.

## Status: DONE 🏆
