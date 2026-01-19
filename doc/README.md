# 💰 Controle de Finanças - Documentação Técnica Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Funcionalidades](#funcionalidades)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Integração com IA](#integração-com-ia)
7. [Banco de Dados](#banco-de-dados)
8. [Implantação](#implantação)
9. [Guia de Desenvolvimento](#guia-de-desenvolvimento)


---

## 🎯 Visão Geral

Sistema completo de **gestão financeira pessoal** desenvolvido com React + TypeScript no frontend e PHP + MySQL no backend. O sistema permite controle total de receitas, despesas, metas financeiras e oferece insights inteligentes powered by Google Gemini AI.

### Principais Características

- ✅ **Dashboard Interativo** - Visão completa do saldo, receitas e despesas
- ✅ **Múltiplas Formas de Entrada** - Manual, CSV e OCR de recibos
- ✅ **Relatórios Inteligentes** - Gráficos interativos com insights de IA
- ✅ **Metas Financeiras** - Acompanhamento de objetivos com planejamento automático
- ✅ **Agenda de Contas** - Gerenciamento de despesas recorrentes
- ✅ **Análise Preditiva** - Sugestões automáticas de categorização

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
├─────────────────────────────────────────────────────────┤
│  Components:                                             │
│  ├─ Dashboard      (Visão geral financeira)             │
│  ├─ Transactions   (Cadastro manual/CSV/OCR)            │
│  ├─ Reports        (Gráficos + IA Insights)             │
│  ├─ Goals          (Metas + IA Planner)                 │
│  ├─ Calendar       (Agenda de recorrentes)              │
│  └─ UserProfile    (Perfil + Avatar upload)             │
├─────────────────────────────────────────────────────────┤
│  Services:                                               │
│  └─ apiService.ts  (Cliente de API centralizado)        │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (PHP + MySQL)                  │
├─────────────────────────────────────────────────────────┤
│  API Endpoints:                                          │
│  ├─ /auth          (Login/Registro)                     │
│  ├─ /transactions  (CRUD de transações)                 │
│  ├─ /recurring     (Contas recorrentes)                 │
│  ├─ /goals         (Metas financeiras)                  │
│  └─ /users         (Perfil + Avatar)                    │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              DATABASE (MySQL/MariaDB)                    │
├─────────────────────────────────────────────────────────┤
│  Tables:                                                 │
│  ├─ users                (Autenticação)                 │
│  ├─ transactions         (Movimentações)                │
│  ├─ recurring_transactions (Contas fixas)               │
│  └─ goals                (Objetivos)                    │
└─────────────────────────────────────────────────────────┘
                           +
┌──────────────────────────────────────────────────────────┐
│          INTEGRAÇÕES EXTERNAS                            │
├──────────────────────────────────────────────────────────┤
│  ├─ Google Gemini AI 2.5  (Insights + OCR + Planner)    │
│  └─ ExcelJS               (Exportação de relatórios)    │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ Funcionalidades

### 1. 📊 Dashboard

**Arquivo**: `components/Dashboard.tsx`

- **Visual Timeline**: Componente visual para seleção rápida de Ano e Mês.
- **Saldo Total**: Soma de todas as transações (receitas - despesas)
- **Receitas do Mês**: Total de entradas do mês atual
- **Despesas do Mês**: Total de saídas do mês atual
- **Botão "Apagar Tudo"**: Limpa todas as transações para recomeçar

**Lógica de Cálculo**:
```typescript
// Arredondamento consistente para evitar erros de floating point
const saldoTotal = Math.round(total * 100) / 100;
```

### 2. 💸 Transações

**Arquivo**: `components/TransactionDialog.tsx`

#### 2.1 Entrada Manual
- Data (formato YYYY-MM-DD)
- Histórico/Descrição
- Valor (aceita vírgula ou ponto como decimal)
- Dependência/Origem

#### 2.2 Importação CSV
**Suporta múltiplos formatos bancários brasileiros**:

- ✅ Auto-detecção de delimitador (`;` ou `,`)
- ✅ Auto-detecção de encoding (UTF-8 ou Windows-1252)
- ✅ Inteligência para identificar colunas:
  - Data (DD/MM/YYYY, YYYY-MM-DD, etc.)
  - Histórico
  - Valor (R$ 1.234,56 ou 1,234.56)
  - Débito/Crédito separados
- ✅ **Ignora automaticamente linhas de "SALDO"**
- ✅ **Detecção de Duplicatas**: Hash baseado em (data + histórico + valor) impede a re-importação.
  - Exibe alerta com contagem de novos vs duplicados.
  - Permite importar apenas os novos.
- ✅ Trata valores negativos corretamente

**Heurística de Valor**:
```typescript
// Detecta formato BR (1.234,56) vs US (1,234.56)
if (tem_ponto && tem_virgula) {
  if (posicao_virgula > posicao_ponto) {
    // BR: 1.234,56 → remove ponto, troca vírgula por ponto
  } else {
    // US: 1,234.56 → remove vírgula
  }
}
```

#### 2.3 OCR de Recibos (Gemini AI)
- Upload de foto do recibo
- Extração automática via **Gemini 2.5 Flash**:
  - Data
  - Valor total
  - Estabelecimento
  - Descrição
- Retorna JSON estruturado para autocompletar o formulário

### 3. 📈 Relatórios

**Arquivo**: `components/Reports.tsx`

#### Gráficos Interativos (Recharts)

1. **Evolução do Saldo Mensal**
   - Line Chart
   - Mostra saldo dia a dia do mês
   - **Inclui transações futuras** para bater com Dashboard

2. **Receitas vs Despesas**
   - Bar Chart
   - Comparativo mensal

3. **Top 5 Gastos por Categoria**
   - Horizontal Bar Chart
   - Valores em R$
   - Cores distintas

#### Insights de IA (Gemini 2.5 Flash)
- Botão "Gerar Insights"
- Envia últimas 15 transações
- Retorna 3 conselhos práticos e objetivos
- Exemplo de prompt:
  ```
  Você é um consultor financeiro experiente. 
  Analise estes dados e dê 3 conselhos práticos...
  ```

#### Exportação para Excel
- Botão "Exportar para Excel"
- Gera `.xlsx` com todas as transações
- Formatação automática de moeda, data, etc.

### 4. 🎯 Metas Financeiras

**Arquivo**: `components/Goals.tsx`

- **Criar Meta**: Título, valor alvo, cor
- **Adicionar Progresso**: Incrementar valor atual
- **Barra de Progresso**: Visual com porcentagem
- **Excluir Meta**: Remove objetivo

#### Planejamento com IA (Gemini 2.5 Flash)
- Botão "Gerar Plano de Ação"
- Analisa:
  - Metas cadastradas (título, alvo, progresso)
  - Saldo estimado atual
- Retorna 3 passos realistas para atingir as metas

### 5. 📅 Agenda de Contas

**Arquivo**: `components/CalendarView.tsx`

- **Visualização Mensal**: Grid com todos os dias
- **Contas Recorrentes**: Aparecem no dia do vencimento
- **Transações Agendadas**: Coloridas por tipo (receita/despesa)
- **Destaque do Dia Atual**: Fundo azul

**Gerenciamento de Recorrentes**:
- Título, valor, dia do vencimento, categoria
- Ativar/Desativar
- Editar e excluir

### 6. 🤖 Sugestões Inteligentes

**Arquivo**: `components/RecurringSuggestions.tsx`

**Detecta automaticamente** transações que se repetem:
- Mesmo histórico
- Valores similares
- Aparecem em 2+ meses

**Sugere criar conta recorrente** com:
- Título sugerido
- Valor médio
- Categoria detectada

### 7. 👤 Perfil do Usuário

**Arquivo**: `components/UserProfile.tsx`

- **Editar Nome e Email**
- **Upload de Avatar**:
  - Validação de tipo (JPG, PNG, GIF, WEBP)
  - Limite de 2MB
  - Preview antes do upload
  - Upload automático ao selecionar
  - **Correção de Persistência**: O avatar é retornado no login para garantir persistência entre sessões.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Uso |
|-----------|---------|-----|
| **React** | 19.0.0 | Framework principal |
| **TypeScript** | 5.8.2 | Tipagem estática |
| **Vite** | 6.4.1 | Ferramenta de compilação |
| **Recharts** | 2.15.0 | Gráficos interativos |
| **ExcelJS** | 4.4.0 | Exportação Excel |
| **@google/generative-ai** | 0.24.1 | Integração Gemini AI |

### Backend
| Tecnologia | Uso |
|-----------|-----|
| **PHP** | 7.4+ (API REST) |
| **MySQL/MariaDB** | Banco de dados |

### Styling
- **Tailwind CSS** (via classes utilitárias inline)
- Design responsivo
- Preparado para modo escuro

---

## 📂 Estrutura do Projeto

```
controledefinancas/
├── components/              # Componentes React
│   ├── Auth.tsx            # Login/Registro
│   ├── Dashboard.tsx       # Painel principal
│   ├── TransactionDialog.tsx  # Diálogo de transações
│   ├── Reports.tsx         # Relatórios e gráficos
│   ├── Goals.tsx           # Metas financeiras
│   ├── CalendarView.tsx    # Agenda mensal
│   ├── RecurringSuggestions.tsx  # Sugestões automáticas
│   ├── UserProfile.tsx     # Perfil do usuário
│   └── Layout.tsx          # Layout com navegação
│
├── services/
│   └── apiService.ts       # Cliente de API
│
├── api/                    # Backend PHP
│   ├── auth.php           # Autenticação
│   ├── transactions.php   # CRUD transações
│   ├── recurring.php      # Contas recorrentes
│   ├── goals.php          # Metas
│   ├── users.php          # Perfil
│   ├── db.php             # Conexão DB
│   ├── cors.php           # Headers CORS
│   └── schema.sql         # Schema do banco
│
├── doc/
│   └── README.md          # Esta documentação
│
├── .env.local             # Variáveis locais (dev)
├── .env.production        # Variáveis produção
├── vite.config.ts         # Configuração Vite
├── types.ts               # Tipos TypeScript
└── package.json           # Dependências

```

---

## 🤖 Integração com IA

### Google Gemini AI 2.5 Flash

**Biblioteca**: `@google/generative-ai` v0.24.1

#### Configuração

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

#### Uso 1: Insights Financeiros (Reports.tsx)

```typescript
const prompt = `Você é um consultor financeiro experiente. 
Analise estes dados financeiros (em PT-BR) e dê 3 conselhos práticos...`;

const result = await model.generateContent(prompt);
const response = result.response;
const text = response.text();
```

#### Uso 2: Planejamento de Metas (Goals.tsx)

```typescript
const context = {
  metas: goals.map(g => ({ titulo, alvo, atual })),
  saldoEstimado: saldoTotal
};

const prompt = `Analise minhas metas financeiras e sugira um plano de ação...`;
```

#### Uso 3: OCR de Recibos (TransactionDialog.tsx)

```typescript
const result = await model.generateContent([
  {
    inlineData: {
      data: base64Data,
      mimeType: 'image/jpeg'
    }
  },
  { text: "Extract receipt info: date, value, merchant, description. Return JSON..." }
]);
```

**Modelo**: `gemini-2.5-flash`
- ✅ 1,048,576 tokens entrada
- ✅ 65,536 tokens saída
- ✅ Suporta texto, imagens, vídeo, áudio
- ✅ Limites free tier adequados

---

## 🗄️ Banco de Dados

### Schema Principal

```sql
-- Usuários
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transações
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  data DATE NOT NULL,
  dependencia_origem VARCHAR(255),
  historico TEXT,
  data_balancete DATE,
  numero_documento VARCHAR(100),
  valor DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contas Recorrentes
CREATE TABLE recurring_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  dia_vencimento INT NOT NULL,
  categoria VARCHAR(100),
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Metas Financeiras
CREATE TABLE goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  valor_meta DECIMAL(15,2) NOT NULL,
  valor_atual DECIMAL(15,2) DEFAULT 0,
  cor VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🚀 Implantação

### Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Edite .env.local:
VITE_GEMINI_API_KEY=sua_chave_aqui

# 3. Rodar em modo dev
npm run dev

# 4. Acessar
http://localhost:3000
```

### Produção no QNAP NAS

```bash
# 1. Build de produção
npm run build

# 2. Copiar dist/ para QNAP
# Ex: \\192.168.x.x\Web\controledefinancas\

# 3. Configurar backend PHP
# Copiar api/ para mesmo diretório

# 4. Configurar banco de dados
# Importar schema.sql no MySQL do QNAP (porta 3307)
```

**Configurações Específicas QNAP**:

- **CORS**: Configurado em `api/cors.php`
- **Porta MySQL**: `127.0.0.1:3307` (TCP, não socket)
- **Proxy reverso**: Opcional via Nginx

---

## 👨‍💻 Guia de Desenvolvimento

### Convenções de Código

- ✅ **Comentários em português**
- ✅ **Mensagens de erro em português**
- ✅ **Tipos TypeScript para tudo**
- ✅ **Componentes funcionais + Hooks**
- ✅ **Estado local com useState**
- ✅ **Efeitos com useEffect**

### Como Adicionar Nova Funcionalidade

1. **Criar componente** em `components/`
2. **Definir tipos** em `types.ts`
3. **Criar endpoint** em `api/`
4. **Adicionar rota** no `App.tsx`
5. **Atualizar navegação** em `Layout.tsx`

### Exemplo: Adicionar Nova Categoria

```typescript
// 1. Atualizar types.ts
export interface Transaction {
  // ... campos existentes
  categoria?: string;  // NOVO
}

// 2. Atualizar schema.sql
ALTER TABLE transactions ADD categoria VARCHAR(100);

// 3. Atualizar componente TransactionDialog.tsx
const [categoria, setCategoria] = useState('');

// 4. Atualizar apiService.ts se necessário
```

---

## 🔧 Solução de Problemas

### Problema: IA retorna erro 404
**Solução**: Verificar se modelo é `gemini-2.5-flash` (não 1.5)

### Problema: CSV não importa
**Solução**: 
- Verificar encoding (UTF-8 ou Windows-1252)
- Verificar delimitador (`;` ou `,`)

### Problema: Saldo não bate com banco
**Solução**: 
1. Apagar tudo
2. Adicionar "Saldo Inicial" manualmente
3. Importar CSV

### Problema: Build falha
**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Histórico de Alterações

### v1.2.0 (Janeiro 2026)
- ✅ Seletor de Período (Timeline) no Dashboard
- ✅ Detecção de transações duplicadas na importação CSV
- ✅ Persistência do Avatar do usuário
- ✅ Nova Logo e Favicon

### v1.0.0 (2025-01-01)
- ✅ Migração para `@google/generative-ai`
- ✅ Modelo atualizado: `gemini-2.5-flash`
- ✅ Gráfico de barras horizontal
- ✅ Avatar personalizado
- ✅ Saldo 100% preciso
- ✅ Agenda com espaçamento correto
- ✅ Documentação completa em português

---

## 📄 Licença

Proprietário - Uso pessoal

---

## 👥 Autor

Desenvolvido por Julio Cezar Sousa
