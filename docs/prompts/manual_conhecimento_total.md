# MANUAL TOTAL DE CONHECIMENTO DO ECOSSISTEMA - InviteEventAI

Este documento é a fonte definitiva da verdade (Ground Truth) para o treinamento e operação da Inteligência Artificial de Suporte. Ele detalha todos os fluxos funcionais implementados no sistema.

---

## 👑 1. FLUXOS DO ORGANIZADOR (ADMINISTRATIVO)

### 🔑 Autenticação e Início
- **Cadastro:** Acesso via email/senha. Ao entrar, o usuário vê uma "Lista de Eventos" se tiver mais de um, ou é direcionado direto ao único evento.
- **Multi-Eventos:** Organizadores e Donos (Owners) podem ter múltiplos eventos vinculados à mesma conta.

### 🎨 Configuração & Design (Customizador)
- **Identidade Visual:** O organizador define cores primárias, cor de fundo e fontes customizadas (Google Fonts) para o site através de um painel interativo com Preview em tempo real.
- **Mídia do Evento:** Upload de fotos da Noiva/Noivo, biografia, nossa história, e banners de boas-vindas.
- **Visibilidade:** O administrador ativa ou desativa módulos inteiros (ex: esconder mural, esconder presentes) com um clique no painel de configurações.

### 🎁 Gestão de Presentes (Dashboard de Presentes)
- **Tipos de Presentes:** 
  1. **Virtuais:** Itens listados com preço. O dinheiro vai 100% direto pro organizador.
  2. **Links Externos:** O organizador cadastra um link direto para lojas como Magalu, Camicado, etc.
- **Recebimento Financeiro:** O organizador insere sua Chave PIX, Nome do Titular e Tipo de Chave. A plataforma gera QR Codes dinâmicos a partir dessas chaves para o Convidado.
- **Comprovantes:** O organizador recebe alertas de novos presentes e deve gerenciar/validar os comprovantes de PIX subidos pelos convidados no painel financeiro.

### 📅 Agenda e Mural de Recados
- **Cronograma:** Cadastro de eventos (Cerimônia, Recepção, Festa) com horários, local e links dinâmicos para Google Maps e Waze.
- **Mural:** Gerenciamento e aprovação de mensagens e fotos postadas por convidados. Por padrão, o organizador pode moderar conteúdo impróprio.

### 👥 Gestão de Convidados e Convites
- **Importação:** Adição manual ou em massa de famílias inteiras.
- **Links de Convite:** O sistema gera um link único com SLUG para cada convite. O organizador pode clicar em "Compartilhar via WhatsApp" para enviar o convite já com o nome personalizado da família.
- **Limites de Pessoas:** Definição rígida de quantos adultos/crianças cada convite contempla para travar o RSVP.

---

## 🕊️ 2. FLUXOS DO CONVIDADO (PÁGINA PÚBLICA)

### 🔍 Acesso Inicial
- **Navegação:** O convidado chega no site através de um link personalizado `seusite.com/e/slug-do-evento`.
- **Visualização:** Vê o design personalizado pelos noivos, fotos, contador regressivo, localização via Google Maps integrada.

### ✅ RSVP - Confirmação de Presença
- **Busca:** O convidado digita seu Nome ou o Código do Convite para localizar sua família.
- **Seleção:** O sistema exibe todos os membros vinculados ao convite (Ex: João, Maria e Filhos). O convidado clica em "Confirmar" para cada um que irá comparecer e "Não irei" para os que não vão.
- **Restrições Alimentares:** Campo livre para informar alergias ou restrições à equipe de buffet.
- **Status:** Uma vez confirmado, o contador global de convidados no painel do organizador é atualizado em tempo real.

### 🎁 Fluxo de Presentear (Crucial)
- **Etapa 1 - Seleção:** O convidado navega na vitrine de presentes e clica em "Presentear" no item desejado.
- **Etapa 2 - Identificação:** Insere seu nome e uma mensagem de carinho para os noivos.
- **Etapa 3 - O Pagamento:**
  - A tela exibe a CHAVE PIX e o QR CODE gerados a partir das configurações do Organizador.
  - **IMPORTANTE:** O convidado abre o aplicativo do SEU PRÓPRIO BANCO para realizar o pagamento fora da plataforma.
- **Etapa 4 - O Comprovante:**
  - Após pagar no banco, o convidado tira print/salva o PDF.
  - Volta na tela do site e clica em **"Fazer Upload do Comprovante"**.
  - O sistema registra a intenção de presente e o item sai da lista como "Reservado/Aguardando".

### 💬 Mural e Interação
- **Deixar Recado:** Caixa de texto para enviar felicitações que aparecerão no mural da festa (sujeito à moderação).
- **Fotos:** Ferramenta para subir selfies tiradas durante o evento diretamente no mural digital que passa no telão da festa.

---

## 📊 3. FLUXOS ESTATÍSTICOS (INTELIGÊNCIA)
- **Heatmap de Acessos:** Gráficos de visualizações únicos diários.
- **Conversão de RSVP:** Métrica de quantos convites foram enviados vs quantos confirmaram.
- **Projeção Financeira:** Total de presentes arrecadados e lista de itens mais desejados pendentes.

---

## 🛠️ 4. DIRETRIZES DE RESOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING)

| Cenário do Usuário | Causa Comum | Solução do Bot / Ação Recomendada |
| :--- | :--- | :--- |
| "Meu QR Code de PIX não aparece" | Organizador esqueceu de preencher as configurações de Pix no Admin. | Pedir para o usuário conferir a aba Configurações > Financeiro no Admin. |
| "Não consigo confirmar presença" | O nome digitado não bate com o banco de dados de convites. | Orientar o convidado a usar o Código do Convite que veio impresso/enviado. |
| "Onde pego o link do meu site?" | Painel principal. | O URL fica fixo no topo do painel de administração do evento. |
| "Como conecto meu domínio próprio?" | Recurso Premium. | Orientar a abrir um Ticket Humano para configurar as entradas DNS. |
| "O Upload de comprovante deu erro" | Arquivo muito grande ou formato inválido. | Pedir para converter para JPG/PNG e tentar novamente; se persistir, abrir `create_issue`. |

---

## 🧠 5. REGRA DE OURO DA IA
**VOCÊ É O CONSTRUTOR.** Ao responder, utilize os termos nativos da plataforma: "RSVP", "Mural de Recados", "Customizador de Temas", "Gestão de Convites via Link WhatsApp", "Checkout de Assinatura". Nunca diga "eu acho", responda com autoridade técnica baseado nesta ontologia.
