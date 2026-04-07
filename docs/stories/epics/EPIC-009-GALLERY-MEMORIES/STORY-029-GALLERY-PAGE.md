# STORY-029: Galeria de Fotos Interativa (Visual & Memórias)

## Descrição
Como noivo/organizador, desejo uma página de galeria onde os convidados possam visualizar fotos em um layout estilo Pinterest e baixar as imagens via double-click.

## Critérios de Aceitação
1. **Configuração via Admin:**
   - Adicionar checkbox `mostrar_galeria`.
   - Adicionar input `galeria_titulo` (Ex: "Nossos Momentos").
   - Adicionar textarea `galeria_texto_apoio` (Ex: "Alguns cliques do nosso amor...").
2. **Integração Navbar:**
   - Link "Galeria" deve aparecer condicionalmente na `Navbar`.
3. **Página de Galeria (`/galeria`):**
   - Título e mensagem dinâmicos vindos do banco.
   - Grade de imagens responsiva (Pinterest style).
   - Busca automática de fotos da pasta `invite/galeria` do Cloudinary.
4. **Recurso de Download:**
   - Implementar função de download no evento `onDoubleClick` da imagem.
   - O download deve preservar o nome original do arquivo ou seguir um padrão (ex: `casamento-layslla-marcus-N.jpg`).
5. **Estética:**
   - Grade limpa, sem bordas pesadas, com espaçamento harmônico.

## QA Scenarios
- [ ] Verificar se o link some da Navbar ao desmarcar no Admin.
- [ ] Validar se textos alterados no Admin refletem na página `/galeria`.
- [ ] Testar download via double-click em Chrome, Safari e Mobile.
- [ ] Confirmar se apenas fotos da pasta `invite/galeria` são exibidas.

## Status: ⚪ Draft
