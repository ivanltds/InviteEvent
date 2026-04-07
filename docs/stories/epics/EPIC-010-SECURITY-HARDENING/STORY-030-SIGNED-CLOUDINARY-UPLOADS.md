# STORY-030: Uploads Assinados para Cloudinary

## Descrição
Mudar o fluxo de upload de imagens de "Unsigned" para "Signed" para evitar uploads não autorizados de terceiros.

## Critérios de Aceitação
1. **Assinatura Server-Side:** Criar uma rota de API que gere a assinatura de upload usando a API Key privada.
2. **Update no Widget:** Configurar o `CldUploadWidget` para usar a rota de assinatura.
3. **Restrição de Pasta:** Garantir que os uploads sejam restritos a pastas específicas e validados.

## Status: Draft
