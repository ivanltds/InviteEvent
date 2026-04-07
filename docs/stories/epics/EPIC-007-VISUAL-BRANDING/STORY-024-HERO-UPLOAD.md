# STORY-024: Upload de Imagem Hero Customizada

## Descrição
Como organizador, desejo trocar a imagem principal (Hero) do site para que eu possa exibir uma foto do ensaio pré-wedding do casal.

## Critérios de Aceitação
1. **Upload via Admin:** Adicionar campo de upload na tela de configurações.
2. **Integração Cloudinary:** A imagem deve ser enviada para o Cloudinary e o link armazenado no Supabase.
3. **Substituição Dinâmica:** O componente Hero deve utilizar a URL salva no banco de dados.
4. **Fallback:** Exibir a imagem padrão atual caso nenhuma URL customizada exista.

## Notas Técnicas
- Reutilizar a lógica de upload já implementada no Épico 003.
- Aplicar transformações do Cloudinary (otimização de tamanho e formato) para garantir performance mobile.

## Status: DONE 🏆
