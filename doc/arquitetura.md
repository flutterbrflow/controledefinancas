# 🏗️ Arquitetura do Sistema

## Visão Geral

O **Controle de Finanças** é um sistema completo de gestão financeira pessoal desenvolvido com **React + TypeScript** no frontend e **PHP + MySQL** no backend. O sistema permite controle total de receitas, despesas, metas financeiras e oferece insights inteligentes powered by **Google Gemini AI**.

---

## Diagrama de Arquitetura

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
│   ├── arquitetura.md     # Este arquivo
│   ├── funcionalidades.md # Detalhamento de features
│   ├── banco_de_dados.md  # Schema SQL
│   ├── guia_dev.md        # Guia para desenvolvedores
│   └── implantacao.md     # Guia de deploy
│
├── .env.local             # Variáveis locais (dev)
├── .env.production        # Variáveis produção
├── vite.config.ts         # Configuração Vite
├── types.ts               # Tipos TypeScript
└── package.json           # Dependências
```
