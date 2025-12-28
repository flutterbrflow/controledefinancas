
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, FinanceSummary } from '../types';
import { TransactionDialog } from './TransactionDialog';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary>({
    saldoTotal: 0,
    receitasMes: 0,
    despesasMes: 0
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load transactions from localStorage (Simulating DB)
  useEffect(() => {
    const storageKey = `transactions_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed);
      calculateSummary(parsed);
    }
  }, [user.id]);

  const calculateSummary = (data: Transaction[]) => {
    const total = data.reduce((acc, curr) => acc + curr.valor, 0);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthData = data.filter(t => {
      const d = new Date(t.data);
      if (isNaN(d.getTime())) return false;
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const receitas = monthData
      .filter(t => t.valor > 0)
      .reduce((acc, curr) => acc + curr.valor, 0);
    
    const despesas = monthData
      .filter(t => t.valor < 0)
      .reduce((acc, curr) => acc + curr.valor, 0);

    setSummary({
      saldoTotal: total,
      receitasMes: receitas,
      despesasMes: Math.abs(despesas)
    });
  };

  const handleImport = (newTransactions: Transaction[]) => {
    const updated = [...newTransactions, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updated));
    calculateSummary(updated);
    setIsDialogOpen(false);
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search Term Match (History or Origin)
      const matchesSearch = t.historico.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.dependenciaOrigem.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date Range Match
      const tDate = new Date(t.data);
      const matchesDateFrom = dateFrom ? tDate >= new Date(dateFrom) : true;
      const matchesDateTo = dateTo ? tDate <= new Date(dateTo) : true;
      
      // Value Range Match
      const val = Math.abs(t.valor);
      const matchesMinVal = minValue ? val >= parseFloat(minValue) : true;
      const matchesMaxVal = maxValue ? val <= parseFloat(maxValue) : true;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinVal && matchesMaxVal;
    });
  }, [transactions, searchTerm, dateFrom, dateTo, minValue, maxValue]);

  const generateSampleData = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const year = now.getFullYear();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const samples: Transaction[] = [
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-05`, dependenciaOrigem: 'Trabalho', historico: 'Salário Mensal', dataBalancete: null, numeroDocumento: '101', valor: 5500.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-07`, dependenciaOrigem: 'Freelance', historico: 'Projeto Web Design', dataBalancete: null, numeroDocumento: '102', valor: 1200.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-02`, dependenciaOrigem: 'Imobiliária', historico: 'Aluguel Apto', dataBalancete: null, numeroDocumento: '201', valor: -2200.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-10`, dependenciaOrigem: 'Supermercado', historico: 'Compras do Mês', dataBalancete: null, numeroDocumento: '202', valor: -850.40, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-12`, dependenciaOrigem: 'Restaurante', historico: 'Jantar de Sábado', dataBalancete: null, numeroDocumento: '203', valor: -120.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-15`, dependenciaOrigem: 'Posto Shell', historico: 'Combustível', dataBalancete: null, numeroDocumento: '204', valor: -250.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-18`, dependenciaOrigem: 'Streaming', historico: 'Netflix / Spotify', dataBalancete: null, numeroDocumento: '205', valor: -75.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-20`, dependenciaOrigem: 'Vendas', historico: 'Venda de Itens Usados', dataBalancete: null, numeroDocumento: '103', valor: 350.00, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-22`, dependenciaOrigem: 'Farmácia', historico: 'Medicamentos', dataBalancete: null, numeroDocumento: '206', valor: -45.90, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, data: `${year}-${pad(currentMonth)}-25`, dependenciaOrigem: 'Lazer', historico: 'Cinema e Pipoca', dataBalancete: null, numeroDocumento: '207', valor: -90.00, createdAt: new Date().toISOString() },
    ];

    const updated = [...samples, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updated));
    calculateSummary(updated);
    alert('✅ Dados de exemplo gerados com sucesso! Verifique a aba de Relatórios para ver os gráficos.');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
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
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={generateSampleData}
            className="flex-1 sm:flex-none border border-blue-600 text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
          >
            Gerar Dados Exemplo
          </button>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
          >
            Nova Transação
          </button>
        </div>
      </div>

      {/* Summary Cards */}
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

      {/* Transactions Table Section */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    {transactions.length === 0 
                      ? "Nenhuma transação encontrada. Clique em 'Gerar Dados Exemplo' para começar!"
                      : "Nenhuma transação corresponde aos filtros aplicados."}
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 10).map((t) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length > 10 && (
          <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
            <p className="text-sm text-gray-500">Mostrando os 10 resultados mais recentes de um total de {filteredTransactions.length}.</p>
          </div>
        )}
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
