
// Importações necessárias para o componente Dashboard
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, FinanceSummary } from '../types';
import { TransactionDialog } from './TransactionDialog';
import { apiService } from '../services/api';

// Interface que define as propriedades do componente Dashboard
interface DashboardProps {
  user: User; // Usuário logado
}

// Componente principal do Dashboard - exibe visão geral financeira
export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Estado para armazenar todas as transações do usuário
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Controla abertura/fechamento do diálogo de nova transação
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Armazena resumo financeiro (saldo total, receitas e despesas do mês)
  const [summary, setSummary] = useState<FinanceSummary>({
    saldoTotal: 0,
    receitasMes: 0,
    despesasMes: 0
  });

  // Estados para controle de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para seletor de período (timeline)
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-11

  // Constantes para o seletor de período
  const START_YEAR = 2025;
  const END_YEAR = currentDate.getFullYear();
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  // Efeito para ajustar o mês selecionado quando o ano mudar
  useEffect(() => {
    const isCurrentYear = selectedYear === currentDate.getFullYear();
    const maxMonth = isCurrentYear ? currentDate.getMonth() : 11;

    // Se o mês selecionado estiver além do máximo disponível, ajustar
    if (selectedMonth > maxMonth) {
      setSelectedMonth(maxMonth);
    }
  }, [selectedYear]);

  // Efeito que carrega transações da API quando o componente é montado
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // Busca todas as transações do usuário
        const data = await apiService.getTransactions(user.id);
        if (Array.isArray(data)) {
          setTransactions(data);
          // Calcula resumo financeiro com os dados carregados
          calculateSummary(data);
        }
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
      }
    };
    loadTransactions();
  }, [user.id]); // Recarrega quando o ID do usuário muda

  // Função que calcula o resumo financeiro (saldo total, receitas e despesas do mês)
  const calculateSummary = (data: Transaction[]) => {
    // Arredonda para 2 casas decimais para evitar problemas de ponto flutuante
    const total = Math.round(data.reduce((acc, curr) => acc + curr.valor, 0) * 100) / 100;

    // Obtém mês e ano atuais
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthStr = `${currentYear}-${currentMonth}`;

    // Filtra apenas transações do mês atual
    const monthData = data.filter(t => {
      if (!t.data) return false;
      // Compara YYYY-MM diretamente para evitar problemas de fuso horário
      return t.data.startsWith(currentMonthStr);
    });

    // Calcula total de receitas (valores positivos) do mês
    const receitas = Math.round(monthData
      .filter(t => t.valor > 0)
      .reduce((acc, curr) => acc + curr.valor, 0) * 100) / 100;

    // Calcula total de despesas (valores negativos) do mês
    const despesas = Math.round(monthData
      .filter(t => t.valor < 0)
      .reduce((acc, curr) => acc + curr.valor, 0) * 100) / 100;

    // Atualiza estado do resumo financeiro
    setSummary({
      saldoTotal: total,
      receitasMes: receitas,
      despesasMes: Math.abs(despesas) // Converte para valor positivo para exibição
    });
  };

  // Função auxiliar para criar chave única de transação (para detecção de duplicatas)
  const createTransactionKey = (t: Transaction | Partial<Transaction>) => {
    const data = t.data || '';
    const historico = (t.historico || '').toLowerCase().trim();
    const valor = Math.round((t.valor || 0) * 100); // Arredonda para evitar problemas de ponto flutuante
    return `${data}|${historico}|${valor}`;
  };

  const handleImport = async (newTransactions: Transaction[]) => {
    try {
      // Verificar duplicatas comparando com transações existentes
      const existingKeys = new Set(transactions.map(createTransactionKey));

      const duplicates: Transaction[] = [];
      const uniqueTransactions: Transaction[] = [];

      for (const t of newTransactions) {
        const key = createTransactionKey(t);
        if (existingKeys.has(key)) {
          duplicates.push(t);
        } else {
          uniqueTransactions.push(t);
          existingKeys.add(key); // Evita duplicatas dentro do próprio CSV
        }
      }

      // Se houver duplicatas, perguntar ao usuário
      if (duplicates.length > 0) {
        const totalNovas = uniqueTransactions.length;
        const totalDuplicadas = duplicates.length;

        const mensagem = `⚠️ Foram encontradas ${totalDuplicadas} transação(ões) duplicada(s) no arquivo.\n\n` +
          `📊 Resumo:\n` +
          `• ${totalNovas} transação(ões) nova(s)\n` +
          `• ${totalDuplicadas} duplicata(s) detectada(s)\n\n` +
          `Deseja importar:\n` +
          `[OK] - Apenas as ${totalNovas} transações novas\n` +
          `[Cancelar] - Cancelar toda a importação`;

        if (!window.confirm(mensagem)) {
          return; // Usuário cancelou
        }

        // Se não houver transações novas após remover duplicatas
        if (uniqueTransactions.length === 0) {
          alert('ℹ️ Todas as transações do arquivo já existem no sistema. Nenhuma importação realizada.');
          setIsDialogOpen(false);
          return;
        }

        // Importar apenas as transações únicas
        await apiService.addTransaction(user.id, uniqueTransactions);
        alert(`✅ Importação concluída!\n\n• ${uniqueTransactions.length} transação(ões) importada(s)\n• ${duplicates.length} duplicata(s) ignorada(s)`);
      } else {
        // Sem duplicatas, importar tudo
        await apiService.addTransaction(user.id, newTransactions);
      }

      const updatedData = await apiService.getTransactions(user.id);
      setTransactions(updatedData);
      calculateSummary(updatedData);
      setIsDialogOpen(false);
    } catch (err: any) {
      alert(`Erro ao importar transações: ${err.message}`);
    }
  };

  // Lógica de Filtro - inclui filtro por período selecionado
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filtro por período selecionado (ano/mês)
      const selectedMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const matchesPeriod = t.data?.startsWith(selectedMonthStr);
      if (!matchesPeriod) return false;

      // Filtro por Termo de Busca (Histórico ou Origem)
      const matchesSearch = t.historico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.dependenciaOrigem.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por Data
      const tDate = new Date(t.data);
      const matchesDateFrom = dateFrom ? tDate >= new Date(dateFrom) : true;
      const matchesDateTo = dateTo ? tDate <= new Date(dateTo) : true;

      // Filtro por Valor
      const val = Math.abs(t.valor);
      const matchesMinVal = minValue ? val >= parseFloat(minValue) : true;
      const matchesMaxVal = maxValue ? val <= parseFloat(maxValue) : true;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinVal && matchesMaxVal;
    });
  }, [transactions, searchTerm, dateFrom, dateTo, minValue, maxValue, selectedYear, selectedMonth]);

  const generateSampleData = async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const year = now.getFullYear();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const samples: Partial<Transaction>[] = [
      { data: `${year}-${pad(currentMonth)}-05`, dependenciaOrigem: 'Trabalho', historico: 'Salário Mensal', valor: 5500.00 },
      { data: `${year}-${pad(currentMonth)}-07`, dependenciaOrigem: 'Freelance', historico: 'Projeto Web Design', valor: 1200.00 },
      { data: `${year}-${pad(currentMonth)}-02`, dependenciaOrigem: 'Imobiliária', historico: 'Aluguel Apto', valor: -2200.00 },
      { data: `${year}-${pad(currentMonth)}-10`, dependenciaOrigem: 'Supermercado', historico: 'Compras do Mês', valor: -850.40 },
      { data: `${year}-${pad(currentMonth)}-12`, dependenciaOrigem: 'Restaurante', historico: 'Jantar de Sábado', valor: -120.00 },
      { data: `${year}-${pad(currentMonth)}-15`, dependenciaOrigem: 'Posto Shell', historico: 'Combustível', valor: -250.00 },
      { data: `${year}-${pad(currentMonth)}-18`, dependenciaOrigem: 'Streaming', historico: 'Netflix / Spotify', valor: -75.00 },
      { data: `${year}-${pad(currentMonth)}-20`, dependenciaOrigem: 'Vendas', historico: 'Venda de Itens Usados', valor: 350.00 },
      { data: `${year}-${pad(currentMonth)}-22`, dependenciaOrigem: 'Farmácia', historico: 'Medicamentos', valor: -45.90 },
      { data: `${year}-${pad(currentMonth)}-25`, dependenciaOrigem: 'Lazer', historico: 'Cinema e Pipoca', valor: -90.00 },
    ];

    try {
      for (const sample of samples) {
        await apiService.addTransaction(user.id, sample);
      }
      const updatedData = await apiService.getTransactions(user.id);
      setTransactions(updatedData);
      calculateSummary(updatedData);
      alert('✅ Dados de exemplo gerados com sucesso!');
    } catch (err) {
      alert('Erro ao gerar dados de exemplo.');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Isso apagará TODOS os seus registros de transações permanentemente. Deseja continuar?')) {
      return;
    }
    try {
      await apiService.deleteAllTransactions(user.id);
      setTransactions([]);
      setSummary({ saldoTotal: 0, receitasMes: 0, despesasMes: 0 });
      alert('✅ Todos os registros foram apagados.');
    } catch (err) {
      alert('Erro ao apagar registros.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('❓ Deseja realmente excluir esta transação?')) {
      return;
    }
    try {
      await apiService.deleteTransaction(user.id, id);
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      calculateSummary(updated);
    } catch (err) {
      alert('Erro ao excluir transação.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';

    // Se a data já estiver no formato YYYY-MM-DD do banco, 
    // invertemos manualmente para evitar problemas de fuso horário
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split(/[/-]/);
      if (parts.length === 3) {
        // Assume DD/MM/YYYY se falhar no resto
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      }
    }

    if (isNaN(d.getTime())) return 'Data Inválida';

    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
          <p className="text-gray-500">Bem-vindo de volta, {user.name}!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={generateSampleData}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Gerar Dados Exemplo
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeleteAll}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-red-200"
            >
              Apagar Tudo
            </button>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
          >
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <p className="text-sm font-medium text-gray-500 mb-1">Saldo Atual</p>
          <p className={`text-3xl font-semibold ${summary.saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.saldoTotal)}
          </p>
          <div className="mt-2 text-xs text-gray-400">Total acumulado em conta</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <p className="text-sm font-medium text-gray-500 mb-1">Total de Receitas do Mês</p>
          <p className="text-xl font-medium text-green-600">
            {formatCurrency(summary.receitasMes)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Entradas deste mês
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <p className="text-sm font-medium text-gray-500 mb-1">Total de Despesas do Mês</p>
          <p className="text-xl font-medium text-red-600">
            {formatCurrency(summary.despesasMes)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Saídas deste mês
          </div>
        </div>
      </div>

      {/* Seletor de Período - Timeline de Anos e Meses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Timeline de Anos */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).map((year, index, arr) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex flex-col items-center group relative ${index < arr.length - 1 ? 'flex-1' : ''}`}
              >
                <span className={`text-sm font-semibold transition-colors ${selectedYear === year ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {year}
                </span>
                <div className="flex items-center w-full mt-2">
                  <div className={`w-3 h-3 rounded-full border-2 transition-all z-10 ${selectedYear === year ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`} />
                  {index < arr.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Meses */}
        <div className="flex items-center bg-gray-50">
          <button
            onClick={() => {
              if (selectedMonth === 0) {
                if (selectedYear > START_YEAR) {
                  setSelectedYear(selectedYear - 1);
                  setSelectedMonth(11);
                }
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            disabled={selectedYear === START_YEAR && selectedMonth === 0}
            className="px-3 py-4 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 flex">
            {MONTHS.map((month, index) => {
              // Para o ano atual, mostrar apenas meses até o mês atual
              // Para anos anteriores, mostrar todos os meses
              const isCurrentYear = selectedYear === currentDate.getFullYear();
              const maxMonthIndex = isCurrentYear ? currentDate.getMonth() : 11;

              if (index > maxMonthIndex) return null;

              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(index)}
                  className={`flex-1 py-3 text-xs font-medium transition-all border-b-2 ${selectedMonth === index
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-500 hover:bg-gray-100 border-transparent'
                    }`}
                >
                  {month}/{String(selectedYear).slice(2)}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              const isCurrentYear = selectedYear === currentDate.getFullYear();
              const maxMonth = isCurrentYear ? currentDate.getMonth() : 11;

              if (selectedMonth < maxMonth) {
                setSelectedMonth(selectedMonth + 1);
              } else if (selectedYear < END_YEAR) {
                setSelectedYear(selectedYear + 1);
                setSelectedMonth(0);
              }
            }}
            disabled={selectedYear === END_YEAR && selectedMonth === currentDate.getMonth()}
            className="px-3 py-4 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção da Tabela de Transações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h3 className="font-semibold text-lg text-gray-900 whitespace-nowrap">Últimas Transações</h3>

          <div className="flex flex-1 gap-2 max-w-2xl">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar histórico ou origem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="hidden sm:block whitespace-nowrap bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Importar CSV
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data de</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data até</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor Mín. (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor Máx. (R$)</label>
                <input
                  type="number"
                  placeholder="99999,99"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFrom('');
                  setDateTo('');
                  setMinValue('');
                  setMaxValue('');
                }}
                className="text-xs text-gray-500 font-medium hover:text-blue-600 transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Histórico</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    {transactions.length === 0
                      ? "Nenhuma transação encontrada. Clique em 'Gerar Dados Exemplo' para começar!"
                      : "Nenhuma transação corresponde aos filtros aplicados."}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(t.data)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {t.historico}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic">
                      {t.dependenciaOrigem}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right whitespace-nowrap ${t.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(t.valor)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                        title="Excluir transação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500">Mostrando {filteredTransactions.length} transações.</p>
        </div>
      </div>

      <TransactionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onImport={handleImport}
        userId={user.id}
      />
    </div>
  );
};
