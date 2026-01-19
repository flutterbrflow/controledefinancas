# 💰 Controle de Finanças

<div align="center">
  <h3>Sistema Completo de Gestão Financeira Pessoal</h3>
  <p>React + TypeScript + PHP + MySQL + Google Gemini AI</p>
</div>

---

## 🎯 Sobre o Projeto

Sistema de gestão financeira pessoal desenvolvido com tecnologias modernas, oferecendo controle completo de receitas, despesas, metas e insights inteligentes powered by IA.

### ✨ Principais Funcionalidades

- 📊 **Dashboard Interativo** - Saldo, receitas e despesas em tempo real
- 📅 **Navegação por Linha do Tempo** - Filtre facilmente por anos e meses
- 💸 **Múltiplas Formas de Entrada**:
  - ✅ Manual (formulário)
  - ✅ Importação CSV com **detecção de duplicatas**
  - ✅ OCR de Recibos (foto → dados extraídos por IA)
- 📈 **Relatórios Inteligentes**:
  - Gráficos interativos (Recharts)
  - Insights financeiros gerados por IA
  - Exportação para Excel
- 🎯 **Metas Financeiras** com planejamento automático por IA
- 📅 **Agenda de Contas** recorrentes
- 🤖 **Sugestões Automáticas** de categorização
- 👤 **Perfil Personalizável** com upload de avatar persistente

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- PHP 7.4+
- MySQL/MariaDB

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/controledefinancas.git
cd controledefinancas

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local e adicione sua chave do Gemini AI:
VITE_GEMINI_API_KEY=sua_chave_aqui

# 4. Configure o banco de dados
# Importe api/schema.sql no MySQL

# 5. Rode em modo desenvolvimento
npm run dev

# 6. Acesse
http://localhost:3000
```

### Compilação para Produção

```bash
# Gerar build otimizado
npm run build

# Os arquivos estarão em dist/
# Copie dist/ e api/ para seu servidor
```

---

## 🛠️ Tecnologias

### Frontend
- **React** 19 + **TypeScript** 5.8
- **Vite** 6.4 (build tool)
- **Recharts** 2.15 (gráficos)
- **ExcelJS** 4.4 (exportação)
- **Tailwind CSS** (styling)

### Backend
- **PHP** 7.4+ (REST API)
- **MySQL/MariaDB** (banco de dados)

### Integrações
- **Google Gemini AI** 2.5 Flash
- Insights financeiros
- OCR de recibos
- Planejamento de metas

---

## 📚 Documentação

### Para Usuários
- [📖 Guia de Funcionalidades](doc/funcionalidades.md)
- [⚖️ Como Bater Saldo com o Banco](doc/implantacao.md#problema-saldo-não-bate-com-banco)
- [❓ FAQ](README.md#faq)

### Para Desenvolvedores
- [🏗️ Arquitetura](doc/arquitetura.md)
- [📂 Estrutura do Projeto](doc/arquitetura.md#estrutura-do-projeto)
- [🤖 Integração com IA](doc/guia_dev.md#integração-com-ia)
- [🗄️ Schema do Banco](doc/banco_de_dados.md)
- [👨‍💻 Guia de Desenvolvimento](doc/guia_dev.md)

---

## 📖 Funcionalidades Detalhadas

### 1. Dashboard
Visão geral completa das finanças:
- **Linha do Tempo Visual**: Navegue intuitivamente entre anos (2025-2026) e meses.
- Saldo total (soma de todas as transações)
- Receitas do mês atual
- Despesas do mês atual
- Botão "Apagar Tudo" para resetar dados

### 2. Transações

#### Entrada Manual
Formulário simples com campos:
- Data, Histórico/Descrição, Valor, Origem

#### Importação CSV
**Inteligência de parsing**:
- Auto-detecção de delimitador (`;` ou `,`)
- Auto-detecção de encoding (UTF-8, Windows-1252)
- Identificação automática de colunas
- **Ignora linhas de "SALDO" automaticamente**
- **Detecção Inteligente de Duplicatas**: Evita importar a mesma transação duas vezes.
- Suporte a formatos BR (R$ 1.234,56) e US (1,234.56)

#### OCR de Recibos
- Tire foto do recibo **ou faça upload de PDF**
- IA extrai automaticamente:
  - Data da compra
  - Valor total
  - Nome do estabelecimento
  - Descrição
- Dados preenchem formulário automaticamente
- Suportados: JPG, PNG, WEBP, **PDF**

### 3. Relatórios

#### Gráficos
- **Evolução do Saldo**: Line chart dia a dia
- **Receitas vs Despesas**: Bar chart comparativo
- **Top 5 Gastos**: Horizontal bar chart por categoria

#### Insights de IA
Análise inteligente das suas finanças:
- Clique em "Gerar Insights"
- IA analisa últimas 15 transações
- Retorna 3 conselhos práticos

#### Exportação
- Exporte todos os dados para Excel (.xlsx)
- Formatação automática de valores e datas

### 4. Metas Financeiras
- Crie metas (ex: "Viagem", "Reserva de Emergência")
- Acompanhe progresso com barra visual
- **IA gera plano de ação** personalizado para atingir suas metas

### 5. Agenda
- Visualize o mês inteiro
- Gerencis contas recorrentes (luz, internet, aluguel)
- Veja transações agendadas
- Dia atual destacado

### 6. Sugestões Automáticas
- Sistema detecta transações que se repetem
- Sugere criar conta recorrente automaticamente
- Economia de tempo na categorização

---

## ⚖️ Como Bater o Saldo com o Banco

### Configuração Inicial (Primeira Vez)

1. **Encontre o Saldo Inicial** no seu CSV do banco
   - Procure linha com "SALDO" ou "Saldo Anterior"
   - Anote esse valor (ex: R$ 2.605,33)

2. **Adicione no sistema**:
   - Clique em "Nova Transação"
   - Data: mesma da linha de saldo
   - Histórico: "Saldo Inicial"
   - Valor: digite o valor anotado

3. **Importe o CSV**:
   - Sistema ignora linhas de "SALDO" automaticamente
   - Total = Saldo Inicial + Transações ✓

### Próximos Meses
Apenas importe o CSV do novo mês. O saldo inicial continua salvo!

---

## 🚀 Implantação

### Desenvolvimento
```bash
npm run dev  # http://localhost:3000
```

### Produção (QNAP NAS)
```bash
# 1. Build
npm run build

# 2. Copiar dist/ para QNAP
# Ex: \\192.168.x.x\Web\controledefinancas\

# 3. Configurar MySQL (porta 3307)
# 4. Backend PHP já configurado com CORS
```

---

## 🔧 Solução de Problemas

| Problema | Solução |
|----------|--------|
| IA retorna erro 404 | Verificar modelo: `gemini-2.5-flash` |
| CSV não importa | Verificar encoding (UTF-8 ou Windows-1252) |
| Saldo não bate | Adicionar "Saldo Inicial" antes de importar |
| Build falha | `rm -rf node_modules && npm install` |

---

## ❓ FAQ

**P: Posso usar em múltiplas contas bancárias?**
R: Sim! O Dashboard soma todas as transações. Adicione um "Saldo Inicial" para cada conta se necessário.

**P: Os dados ficam salvos onde?**
R: Banco de dados MySQL no seu servidor (local ou QNAP).

**P: Preciso de internet?**
R: Não para uso básico. Apenas para funcionalidades de IA (Insights, OCR, Planejamento).

**P: Como faço backup?**
R: Exporte para Excel ou faça backup do banco MySQL.

---

## 📝 Histórico de Alterações

### v1.2.0 (Janeiro 2026)
- ✅ Seletor de Período (Timeline) no Dashboard
- ✅ Detecção de transações duplicadas na importação CSV
- ✅ Persistência do Avatar do usuário
- ✅ Nova Logo e Favicon

### v1.1.0 (Janeiro 2025)
- ✅ Suporte a PDF no OCR de recibos
- ✅ Formatação consistente de moeda (sempre 2 decimais)
- ✅ Otimizações de performance (utils centralizados)
- ✅ Documentação técnica completa

### v1.0.0 (Janeiro 2025)
- ✅ Lançamento inicial
- ✅ Integração completa com Gemini AI 2.5
- ✅ Suporte a CSV bancário brasileiro
- ✅ OCR de recibos (imagens)
- ✅ Gráficos interativos
- ✅ Metas com IA
- ✅ Documentação completa em português

---

## 📄 Licença

Proprietário - Uso Pessoal

---

## 👥 Autor

Desenvolvido com ❤️ por Julio

---

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

1. Abra uma issue descrevendo a melhoria
2. Ou envie um pull request

---

## 🙏 Agradecimentos

- Google Gemini AI pela API incrível
- Recharts pelos gráficos lindos
- Comunidade React/TypeScript

---

<div align="center">
  <p>⭐ Se este projeto te ajudou, considere dar uma estrela!</p>
</div>
