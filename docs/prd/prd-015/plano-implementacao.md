### A. Extensão do Banco de Dados (Supabase Migration)
```sql
-- Adiciona a flag de curadoria manual do casal
ALTER TABLE public.presentes 
ADD COLUMN is_sonho_casal BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.presentes.is_sonho_casal IS 'Sinaliza se o presente é um destaque manual (Grande Sonho) definido pelos noivos.';
```

### B. Nova Rota da API: `/api/public/presentes/fomo/route.ts`
*   **Método:** `GET`
*   **Parâmetros:** `eventoId` (UUID)
*   **Lógica Interna:**
    1. Buscar todos os `presentes` do evento que possuem `is_sonho_casal = true`.
    2. Buscar `analytics_events` (categoria `'gift'`) das últimas 48h.
    3. Agrupar afinidade (cliques/cesta).
    4. **Hierarquia de Badges:**
       - Se `is_sonho_casal` manual existe -> Badge `'dream'`.
       - Se não existir manual -> Top Afinidade -> Badge `'dream'`.
       - Próximos Afinidade -> Badge `'classic'`.
    5. Retornar dados consolidados.

---

## 💻 2. Implementação no Frontend (Vitrine Pública)

### Local: `src/app/(public)/presentes/page.tsx`

#### Passos de Desenvolvimento:
1.  **Hydrate Hook:** Busca dados de afinidade e flags manuais.
2.  **Smart Sorting Hierarchy:**
    ```typescript
    items.sort((a, b) => {
      // 1. Esgotados por último
      // 2. 'is_sonho_casal' manual primeiro
      if (a.is_sonho_casal && !b.is_sonho_casal) return -1;
      if (!a.is_sonho_casal && b.is_sonho_casal) return 1;
      // 3. Score de Afinidade Telemetria
      // 4. Fallback Data
    });
    ```
3.  **Componentes de UI:**
    - **Tooltip "Muito Cogitado":** Implementar componente de hover sobre ícone SVG de sparkle.
    - **Ícones:** Substituir emojis por componentes Lucide-React.

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
