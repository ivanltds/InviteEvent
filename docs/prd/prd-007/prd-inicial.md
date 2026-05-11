# PRD-007 — Motor de Simulação Imersiva & Blindagem Transacional 🛡️
> Versão: 1.0 | Data: 2026-05-11 | Status: CONCLUÍDO (Póstumo)

## 1. Visão Geral do Produto
Este ciclo focou em prover uma ferramenta nativa e segura para que organizadores de casamentos testem e visualizem a experiência exata de seus convidados. Criou-se um Sandbox de Simulação (`isPreviewMode`) que renderiza a UI real com dados do banco, porém intercepta e simula TODAS as mutações de dados (pagamentos, RSVPs e murais) para evitar poluição no ambiente de produção.

## 2. Alterações Implementadas (Executadas)

### 2.1. Arquitetura de Simulação Isolada (Visualizer Hub)
- **Problema**: Organizadores precisavam usar rotas públicas compartilháveis para ver o convite, gerando ruídos nos dados analíticos e riscos de submeter dados de teste na base de produção.
- **Solução**:
  - **Novo Entrypoint**: `/admin/visualizar` estabelece um portal imersivo que herda o contexto do evento selecionado sem depender de rotas públicas.
  - **Oclusão de Layout**: Modificado o `AdminLayoutClient` para silenciar menus laterais e widgets de suporte ao entrar na rota de visualização, garantindo fidelidade mobile/desktop integral.

### 2.2. Motor de Blindagem Transacional (Transaction Sandboxing)
- **Problema**: O organizador deseja "simular" um pagamento ou RSVP, mas se clicar nos botões, os dados persistem no Supabase/Cloudinary.
- **Solução**:
  - **RSVP Interception**: O componente `RSVP.tsx` detecta o flag `isPreviewMode` e renderiza as animações de sucesso simuladas sem invocar os serviços de API do banco.
  - **Checkout Mocking**: O portal de Presentes desativa uploads para o Cloudinary e emite recibos falsos de validação imediata no modo preview.
  - **Mural Sandbox**: Habilitada leitura de dados reais (para garantir fidelidade), mas submissões de novas mensagens e fotos são desviadas para ciclos de sucesso virtuais instantâneos.

### 2.3. Continuidade de Navegação e Atalhos Inteligentes
- **Problema**: Ao navegar para telas filhas (Mural, Presentes) da simulação, o usuário ficava preso ou era forçado a ver o envelope animado novamente ao voltar.
- **Solução**:
  - **Gateway Skip Handler**: Inserido parâmetro `?skip_gateway=true` nas regressões internas, permitindo que o simulador caia direto no convite aberto.
  - **Unified Regression Links**: Padronizados os links "← Voltar ao Convite" centralizados no topo dos cabeçalhos de Presentes e Mural para evitar colisões com o HUD de configuração.
  - **Double-Lock Egress**: Mantido botão flutuante fixo no topo-esquerdo E nova barra inferior de status para saída rápida e segura da simulação.

### 2.4. Hidratação Dinâmica de Estilos (Font Resilience)
- **Problema**: Fontes personalizadas (Google Fonts) bugavam na primeira carga da visualização por falta de detecção de Slug.
- **Solução**:
  - **Fallback de EventId**: O `DynamicStyles.tsx` agora aceita `eventId` via QueryString como fonte primária para carregar tipografia, operando em paralelo ao mapeamento de slugs legados.
  - **Local Injector**: O `LiveInviteView.tsx` recebeu uma camada de injeção emergencial redundante de `@import` fonts para garantir latência zero na primeira renderização do envelope.

---

## 3. Plano de Testes (QA Execution Strategy)

Abaixo está a matriz de cobertura exigida para certificar a simulação.

### 🧪 Matriz E2E (Playwright)
1. **TEST-007-01: Ingressão no Motor de Simulação**
   - *Passos*: Acessar `/admin/visualizar`.
   - *Esperado*: Layout admin (Sidebar) ocultado; Envelope Visível; Barra inferior de status "Modo Simulação" ativa.
2. **TEST-007-02: Preservação de Estados no Retorno (Bypass)**
   - *Passos*: Entrar na Lista de Presentes dentro da Simulação -> Clicar em "← Voltar ao Convite".
   - *Esperado*: URL contém `skip_gateway=true`; A tela abre DIRETAMENTE no convite SEM o envelope.
3. **TEST-007-03: Hidratação de Estilos por Fallback**
   - *Passos*: Abrir link com `?eventId=UUID` explícito.
   - *Esperado*: As variáveis CSS de tipografia (`--font-cursive`) e background são aplicadas corretamente mesmo sem o slug na URL.

---
*Nota de Homologação: Ciclo de Simulação Validado pelo Maestro AI.*
