# Documentação - Controle de Finanças

Este aplicativo é um gestor financeiro pessoal desenvolvido com **React + Vite** no frontend e **PHP + MySQL** no backend.

## Funcionalidades
- **Dashboard:** Visão geral do saldo, receitas e despesas do mês.
- **Transações:** Cadastro manual, importação de CSV (com suporte a padrão bancário brasileiro) e leitura via OCR (Gemini AI).
- **Relatórios:** Gráficos interativos (Recharts) e exportação para Excel.
- **Agenda:** Gerenciamento de contas recorrentes e visão mensal de gastos.

## Arquitetura
- **Frontend:** React (TypeScript), Tailwind CSS.
- **Backend:** PHP 7.4+ (API REST), MySQL/MariaDB.
- **Integração:** `apiService.ts` gerencia todas as requisições via fetch.

## Banco de Dados
O schema está definido em `api/schema.sql`. As tabelas principais são:
- `users`: Armazena dados de autenticação.
- `transactions`: Registros financeiros.
- `recurring_transactions`: Contas fixas mensais.
- `goals`: Metas de economia.
## ⚖️ Como bater o saldo com o banco

### 📋 Configuração Inicial (Primeira Vez)

Para que o **Saldo Atual** no Dashboard mostre o mesmo valor do seu extrato bancário:

1. **Apague tudo:** Use o botão "Apagar Tudo" na Dashboard para limpar importações anteriores

2. **Encontre o Saldo Inicial:**
   - Abra o CSV do banco no Excel ou Bloco de Notas
   - Procure por uma linha com "SALDO" ou "Saldo Anterior" - esse é o saldo que você tinha no início do período
   - Anote esse valor (ex: R$ 2.605,33)

3. **Adicione o Saldo Inicial no sistema:**
   - Clique em "Nova Transação"
   - Data: use a data da linha "SALDO" do CSV
   - Histórico: "Saldo Inicial"
   - Valor: digite o valor anotado (ex: 2605,33 ou 2605.33)
   - Clique em "Adicionar"

4. **Importe o CSV:**
   - Vá na aba "CSV" e importe o arquivo
   - O sistema vai ignorar as linhas de "SALDO" automaticamente
   - O total será: Saldo Inicial + Todas as Transações = Saldo Real ✓

### 📅 Próximos Meses

**Não precisa criar Saldo Inicial novamente!** Apenas importe o CSV do novo mês. O sistema soma:
- Saldo Inicial (continua salvo)
- Transações antigas (continuam salvas)
- Novas transações do CSV

> **Nota:** Se você tem múltiplas contas (ex: Corrente + Poupança), o Dashboard mostrará a soma total de todas as transações importadas. Crie um Saldo Inicial para cada conta se necessário.

## Deployment no QNAP NAS
O sistema foi otimizado para rodar no servidor Web do QNAP:
1. **Build:** Execute `npm run build` para gerar a pasta `dist`.
2. **Proxy/CORS:** O PHP lida com os headers de CORS para permitir acesso do frontend.
3. **Database:** Utiliza conexão TCP (`127.0.0.1:3307`) para evitar conflitos de rotas locais no NAS.
