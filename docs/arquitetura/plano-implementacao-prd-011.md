# Plano de Implementação Técnica — PRD-011 (Modo Telão)
> **Fase:** ARQUITETURA  
> **Autor:** @architect (Arquiteto de Software)

Este plano especifica a engenharia por trás do slideshow interativo de recados/fotos otimizado para projeção (Modo TV).

---

## 1. Topologia de Rotas e Arquitetura de Componentes

### A. Nova Rota Pública: `/(public)/mural/tv/page.tsx`
*   **Propósito:** Página de visualização imersiva, estática visualmente (sem scrollbar) e 100% gerenciada no Client Side (`use client`).
*   **Parâmetros:** `searchParams.eventId` (Obrigatório) para contextualizar qual Mural carregar.
*   **Componentes Internos:**
    *   `BackgroundAmbiente`: Exibe um desfoque (blur) baseado no item ativo.
    *   `LayoutSplitScreen`: Lado Esquerdo (Mídia) + Lado Direito (Texto formatado estilo Card).
    *   `RodapeInformativo`: Renderizador de QR Code nativo (`qrcode.react` ou via API estática do Google Charts para simplificar zero dependências extras) e CTA de envio.
    *   `BannerNotificacao`: Alert flutuante com AnimatePresence.

---

## 2. Gestão de Estado Realtime (Supabase Channels)

Para garantir que novas fotos "furem a fila" instantaneamente sem dar reload, usaremos o hook `useEffect` para monitorar mudanças via Supabase Realtime nas duas tabelas que compõem o mural:

```typescript
// Rascunho do canal Realtime
useEffect(() => {
  if (!eventId) return;
  
  const channel = supabase
    .channel('mural-tv-changes')
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mural_itens',
        filter: `evento_id=eq.${eventId}` 
      },
      (payload) => {
        // Verificar se está aprovado ou se adicionamos numa fila de espera
        const newItem = payload.new as MuralItem;
        if (newItem.aprovado) {
          exibirImediatamente(newItem);
        }
      }
    )
    // Escutar também a tabela mural_mensagens
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mural_mensagens',
        filter: `evento_id=eq.${eventId}`
      },
      (payload) => {
        const updatedMsg = payload.new;
        if (updatedMsg.status === 'aprovado') {
          exibirImediatamente({
            id: updatedMsg.id,
            tipo: 'MENSAGEM',
            autor: updatedMsg.nome_convidado,
            mensagem: updatedMsg.mensagem
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [eventId]);
```

---

## 3. Lógica da Fila de Slideshow (`Carousel Loop`)

Usaremos um timer cíclico (`setInterval`) de 8 segundos.

1.  **Fila de Exibição (`slides`):** Uma lista embaralhada carregada inicialmente do `muralService.getApprovedItems(eventId)`.
2.  **Ponteiro (`currentIndex`):** Controla o slide ativo.
3.  **Comportamento de Realtime Push:**
    *   Ao receber um evento do websocket, inserimos o novo item no array na posição `[currentIndex + 1]`.
    *   Acionamos o estado `showToast(true)` por 3 segundos.
    *   Forçamos o incremento do ponteiro `setCurrentIndex(currentIndex + 1)` imediatamente (ou no próximo tick curto) para forçar a transição imediata.

---

## 4. Ponto de Acesso Admin

Adicionar no cabeçalho de `src/app/(admin)/admin/mural/page.tsx` um botão de ação global:

```tsx
<Link 
  href={`/mural/tv?eventId=${currentEvent.id}`} 
  target="_blank"
  className={styles.tvModeBtn}
>
  📺 Abrir Modo Telão
</Link>
```

---

## 5. Plano de Testes de QA

1.  **Carga Inicial:** Validar se abre e busca os dados corretos do `eventId` no Supabase.
2.  **Resiliência 16:9:** Testar redimensionamento da janela simulando projetor HD (720p), Full HD (1080p) e 4K.
3.  **Simulação Realtime:** Inserir um dado aprovado via Dashboard e garantir que a TV avisa e muda o slide sozinha em até 2 segundos.
