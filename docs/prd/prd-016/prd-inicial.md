# PRD-016: Motor Viral & Kits de Mídia (Organic Acquisition) 🚀📸

> **Status:** DESCOBERTA  
> **Responsável:** @ba (Analista de Negócios)  
> **Data:** 16 de Maio de 2026  
> **Fase:** Fase 2 - Aquisição Orgânica Autossuficiente

---

## 1. Problema e Oportunidade
O custo de aquisição de clientes (CAC) em canais pagos (Meta/Google Ads) é crescente. No entanto, o **InviteEventAI** possui uma vantagem inerente: cada evento criado é uma vitrine para dezenas ou centenas de convidados, muitos dos quais são potenciais novos clientes (outros noivos).

**A oportunidade:** Facilitar para os noivos a divulgação do seu evento nas redes sociais (especialmente Instagram Stories) através de assets visuais de altíssima qualidade, gerados automaticamente, que incluam o link do convite e a identidade visual da plataforma.

## 2. Personas Impactadas
- **Noivos (Organizadores):** Querem divulgar o casamento de forma elegante e prática, sem precisar criar artes do zero.
- **Convidados:** Recebem o convite através de uma mídia atraente e fácil de interagir (QR Code).
- **Plataforma (SaaS):** Ganha exposição gratuita e orgânica ("Powered by InviteEventAI") em milhares de redes sociais.

## 3. Requisitos Funcionais (Escopo Prioritário)

### 3.1. Instagram Stories Generator
- **Funcionalidade:** Gerador de templates verticais (9:16) no painel Admin.
- **Templates:** Pelo menos 3 variações (Clássico Luxo, Moderno Minimalista, Champagne Gold).
- **Dados Dinâmicos:** Nomes do casal, Data, Contagem Regressiva e Local.
- **Exportação:** Botão "Baixar para Stories" (PNG/JPG de alta resolução).

### 3.2. QR Code Stylized Generator
- **Funcionalidade:** Geração de QR Code que aponta para o slug do convite.
- **Estilização:** Bordas arredondadas, cor temática do evento, logo discreto do InviteEventAI no centro ou rodapé.
- **Uso:** Pode ser inserido nos templates de Stories ou baixado isoladamente para impressão (menus, convites físicos).

### 3.3. Link-in-Bio Booster & Botão de Compartilhamento
- **Funcionalidade:** Facilitar a cópia do link curto e fornecer um "Kit de Divulgação" (Zip ou Galeria) com os assets gerados.
- **CTA:** Sugerir que os noivos adicionem o link na Bio do Instagram com um "copy" persuasivo.

## 4. Requisitos Não-Funcionais
- **Qualidade Visual:** Os assets devem parecer feitos por designers profissionais (Premium Look).
- **Performance:** A geração de imagens no client (ou serverless function) deve ser instantânea (< 2s).
- **Mobile First:** O gerador de kits deve ser totalmente funcional via smartphone (onde os noivos mais usam o Instagram).

## 5. Critérios de Aceite
- [ ] Noivo consegue baixar um card de "Save the Date" estilizado com os dados do seu evento.
- [ ] O QR Code gerado redireciona corretamente para o convite dinâmico.
- [ ] O design segue a paleta de cores (Champagne/Gold) definida no PRD-006.
- [ ] Presença de marca d'água discreta ou link "Powered by" nos assets gratuitos.

---

## 6. Próximos Passos (Fase de Experiência)
- **@ux-ui:** Definir os 3 layouts de templates para o gerador de Stories.
- **@architect:** Definir a tecnologia de renderização de imagem (Canvas API no client vs. Satori/Puppeteer no backend).
- **@dev:** Implementar o motor de geração de QR Code e overlays de texto.

---
*Assinado: @ba (Analista de Negócios)*
