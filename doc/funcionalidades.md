# ⚙️ Funcionalidades Detalhadas

## 1. 📊 Dashboard

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

## 2. 💸 Transações

**Arquivo**: `components/TransactionDialog.tsx`

### 2.1 Entrada Manual
- Data (formato YYYY-MM-DD)
- Histórico/Descrição
- Valor (aceita vírgula ou ponto como decimal)
- Dependência/Origem

### 2.2 Importação CSV
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

### 2.3 OCR de Recibos (Gemini AI)
- Upload de foto do recibo
- Extração automática via **Gemini 2.5 Flash**:
  - Data
  - Valor total
  - Estabelecimento
  - Descrição
- Retorna JSON estruturado para autocompletar o formulário

## 3. 📈 Relatórios

**Arquivo**: `components/Reports.tsx`

### Gráficos Interativos (Recharts)

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

### Insights de IA (Gemini 2.5 Flash)
- Botão "Gerar Insights"
- Envia últimas 15 transações
- Retorna 3 conselhos práticos e objetivos

### Exportação para Excel
- Botão "Exportar para Excel"
- Gera `.xlsx` com todas as transações
- Formatação automática de moeda, data, etc.

### Análise da Poupança
- **Gráfico Aplicações vs Resgates**: Bar chart dos últimos 6 meses
- **Saldo Total da Poupança**: Card em destaque
- **Maiores Movimentações**: Top 5 aplicações/resgates com datas formatadas

## 4. 🎯 Metas Financeiras

**Arquivo**: `components/Goals.tsx`

- **Criar Meta**: Título, valor alvo, cor
- **Adicionar Progresso**: Incrementar valor atual
- **Barra de Progresso**: Visual com porcentagem
- **Excluir Meta**: Remove objetivo

### Planejamento com IA (Gemini 2.5 Flash)
- Botão "Gerar Plano de Ação"
- Analisa metas e saldo para sugerir plano realista.

## 5. 📅 Agenda de Contas

**Arquivo**: `components/CalendarView.tsx`

- **Visualização Mensal**: Grid com todos os dias
- **Contas Recorrentes**: Aparecem no dia do vencimento
- **Transações Agendadas**: Coloridas por tipo (receita/despesa)
- **Destaque do Dia Atual**: Fundo azul

**Gerenciamento de Recorrentes**:
- Título, valor, dia do vencimento, categoria
- Ativar/Desativar
- Editar e excluir

## 6. 🤖 Sugestões Inteligentes

**Arquivo**: `components/RecurringSuggestions.tsx`

**Detecta automaticamente** transações que se repetem:
- Mesmo histórico
- Valores similares
- Aparecem em 2+ meses

**Sugere criar conta recorrente** com:
- Título sugerido
- Valor médio
- Categoria detectada

## 7. 👤 Perfil do Usuário

**Arquivo**: `components/UserProfile.tsx`

- **Editar Nome e Email**
- **Upload de Avatar**:
  - Validação de tipo (JPG, PNG, GIF, WEBP)
  - Limite de 2MB
  - Preview antes do upload
  - Upload automático ao selecionar
  - **Correção de Persistência**: O avatar é retornado no login para garantir persistência entre sessões.
