# Plano de Implementação Técnica — PRD-015 🏛️⚙️

> **Fase:** ARQUITETURA | **Responsável:** @architect | **Data:** 15 de Maio de 2026  
> **Objetivo:** Viabilizar o cálculo de Score de Interesse, entrega de cache distribuído para badges pulsantes (FOMO) e lógica do Consultor Administrativo de Performance.

---

## 📊 1. Arquitetura do Motor de Fomo & Analytics

Para garantir impacto zero na performance e evitar conexões abusivas no banco de dados, usaremos uma rota de API isolada servida com cabeçalhos HTTP de Cache.

### A. Nova Rota da API: `/api/public/presentes/fomo/route.ts`
*   **Método:** `GET`
*   **Parâmetros:** `eventoId` (UUID)
*   **Lógica Interna:**
    1. Buscar todos os `analytics_events` do evento nas últimas 48h pertencentes à categoria `'gift'`.
    2. Agrupar em memória:
        - Cliques totais por `target_id` (ID do presente).
        - Adições à cesta por `target_id`.
        - Número de `session_id` únicos nas últimas 24h por `target_id`.
    3. Calcular o **Score de Afinidade**:
       `Score = (Cliques * 1) + (AdiçãoCesta * 5)`
    4. Mapear as Categorias de Destaque:
       - **Top 1 e 2 de Cliques:** Tipo `'dream'` (O Grande Sonho 💕).
       - **Mais acessado nas últimas 48h:** Tipo `'classic'` (Escolha Clássica 💍).
    5. Retornar o Mapa Compacto:
       ```json
       {
         "success": true,
         "data": {
           "PRESENT_UUID_1": { "score": 25, "badge": "dream", "recentViewers": 4 },
           "PRESENT_UUID_2": { "score": 12, "badge": "classic", "recentViewers": 1 }
         }
       }
       ```
*   **⚡ Cache-Control (RNF-01):**
    A resposta conterá o cabeçalho `s-maxage=60, stale-while-revalidate=30`, garantindo que o Next.js utilize cache de borda (Vercel Edge) sem onerar o banco por acessos subsequentes no mesmo minuto.

---

## 💻 2. Implementação no Frontend (Vitrine Pública)

### Local: `src/app/(public)/presentes/page.tsx`

#### Passos de Desenvolvimento:
1.  **Hydrate Hook:**
    No `useEffect` de montagem, disparar um `fetch` assíncrono para `/api/public/presentes/fomo?eventoId=X` e armazenar o resultado no estado:
    `const [affinityData, setAffinityData] = useState<Record<string, any>>({});`
2.  **Mapeamento do Algoritmo de Ordenação (Vitrine de Afinidade):**
    Refatorar o `useMemo` de `filteredPresentes` para injetar a lógica de ordenação do PRD:
    ```typescript
    const orderedPresentes = useMemo(() => {
      let items = [...filteredPresentes];
      
      // Ordenação Padrão do Sistema:
      items.sort((a, b) => {
        // 1. Exceção: Itens 100% comprados SEMPRE no final
        const isAEsgotado = a.status === 'reservado' || (a.permite_cotas && (a.cotas_compradas ?? 0) >= (a.total_cotas ?? 999));
        const isBEsgotado = b.status === 'reservado' || (b.permite_cotas && (b.cotas_compradas ?? 0) >= (b.total_cotas ?? 999));
        if (isAEsgotado && !isBEsgotado) return 1;
        if (!isAEsgotado && isBEsgotado) return -1;

        // 2. Critério Principal: Score de Afinidade da Telemetria
        const scoreA = affinityData[a.id]?.score ?? 0;
        const scoreB = affinityData[b.id]?.score ?? 0;
        if (scoreA !== scoreB) return scoreB - scoreA; // Maior afinidade no topo!

        // 3. Fallback: Ordem alfabética/inserção padrão
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return items;
    }, [filteredPresentes, affinityData]);
    ```
3.  **Injeção Visual:**
    - Injetar os selos com fonte Serif elegante e opacidade breathing (`.badgeDream` ou `.badgeClassic`).
    - Injetar o rodapé translúcido `✨ Muito cogitado pelos convidados recentemente` apenas se `recentViewers >= 2`.

---

## 🔒 3. Implementação no Admin (Price Suggester)

### Local: `src/app/(admin)/admin/presentes/page.tsx`

#### Lógica de Renderização do Suggester:
1.  **Cálculo do Gatilho Emocional:**
    ```typescript
    const dashboardSuggester = useMemo(() => {
      if (!currentEvent || loading) return null;

      // Regra 1: Casamento com receita zero
      const hasZeroRevenue = stats.totalValorArrecadado === 0;
      if (!hasZeroRevenue) return null;

      // Regra 2: A menos de 45 dias do evento
      const eventTime = new Date(currentEvent.data_evento).getTime();
      const diffDays = (eventTime - Date.now()) / (1000 * 60 * 60 * 24);
      if (diffDays < 0 || diffDays > 45) return null;

      // Regra 3: Buscar o primeiro item elegível (> R$ 300, sem cotas e livre)
      const highTicketGift = presentes.find(p => !p.permite_cotas && p.preco >= 300 && p.status === 'disponivel');
      if (!highTicketGift) return null;

      return {
        gift: highTicketGift,
        daysRemaining: Math.ceil(diffDays)
      };
    }, [currentEvent, presentes, stats, loading]);
    ```

2.  **Componente Visual & Handler:**
    - Se `dashboardSuggester` não for nulo, renderizar o banner `AdminSuggester` no topo do Grid de presentes.
    - **Ação Rápida (Aplicar):**
      Ao clicar, o handler divide o item em cotas dinamicamente:
      - `sugeridoNumCotas = Math.max(2, Math.round(gift.preco / 100));` (ex: R$ 500 vira 5 cotas de R$ 100).
      - Chama `giftService.updateGiftWithReturn` alterando `permite_cotas = true` e `total_cotas = sugeridoNumCotas`.
      - Atualiza localmente a lista e exibe `triggerToast("✨ Cota ativada com sucesso! Seu presente já está mais acessível.")`.

---

## 🧪 4. Cobertura de Testes TDD & Garantias

1.  **Testes Unitários (Jest):**
    - Validar a função de reordenação: deve garantir que itens esgotados fiquem por último mesmo que tenham score de telemetria alto.
2.  **Garantia de Regressão:**
    - O carregamento da vitrine **não pode quebrar** se o endpoint `/api/public/presentes/fomo` falhar ou demorar a responder (usar try/catch blindado no front e tratar como score 0).

---

> **Status da Fase:** Pronto para codificação! O MAESTRO já pode repassar a bola para o **Desenvolvedor (@dev)** para abrir o editor de código. 🏛️👨‍💻
