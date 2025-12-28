// Componente de Relatórios - exibe análises visuais e insights financeiros
// Este componente está 100% comentado em português conforme solicitado
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction } from '../types';
import { apiService } from '../services/api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as ExcelJS from 'exceljs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Label
} from 'recharts';

interface ReportsProps {
  user: User;
}

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  // Estados do componente
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega transações ao montar o componente
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await apiService.getTransactions(user.id);
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
        setError("Não foi possível carregar os dados das transações.");
      }
    };
    loadTransactions();
  }, [user.id]);

  // Função auxiliar para formatar valores em moeda brasileira
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // DADOS PARA GRÁFICO: Fluxo de Caixa nos últimos 6 meses
  const monthlyData = useMemo(() => {
    try {
      const months: Record<string, { month: string, receita: number, despesa: number }> = {};
      const now = new Date();

      // Prepara os últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' });
        months[key] = { month: label, receita: 0, despesa: 0 };
      }

      // Agrupa transações por mês
      transactions.forEach(t => {
        if (!t.data) return;
        const parts = t.data.split('-');
        if (parts.length < 2) return;
        const key = `${parts[0]}-${parts[1]}`;

        if (months[key]) {
          if (t.valor > 0) months[key].receita += t.valor;
          else months[key].despesa += Math.abs(t.valor);
        }
      });

      return Object.values(months);
    } catch (e) {
      return [];
    }
  }, [transactions]);

  // DADOS PARA GRÁFICO: Top 5 Categorias de Despesas
  const categoryData = useMemo(() => {
    try {
      const totals: Record<string, number> = {};

      // Soma despesas por origem
      transactions.filter(t => t.valor < 0).forEach(t => {
        const cat = t.dependenciaOrigem || 'Outros';
        totals[cat] = (totals[cat] || 0) + Math.abs(t.valor);
      });

      // Retorna top 5 com percentuais
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const total = sorted.reduce((acc, [_, val]) => acc + val, 0);

      return sorted.map(([name, value]) => ({
        name,
        value,
        percentage: ((value / total) * 100).toFixed(1) + '%'
      }));
    } catch (e) {
      return [];
    }
  }, [transactions]);

  // DADOS PARA GRÁFICO: Evolução de Saldo no Mês Atual
  const trendData = useMemo(() => {
    try {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const data = [];
      let runningBalance = 0;
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Calcula saldo inicial (transações de meses anteriores)
      transactions.forEach(t => {
        if (!t.data) return;
        const parts = t.data.split('-');
        if (parts.length < 2) return;
        const transMonthStr = `${parts[0]}-${parts[1]}`;
        if (transMonthStr < currentMonthStr) {
          runningBalance += t.valor;
        }
      });

      // Arredonda saldo inicial para evitar erros de ponto flutuante
      runningBalance = Math.round(runningBalance * 100) / 100;

      // Calcula saldo dia a dia no mês atual (até HOJE ou fim do mês, o que vier primeiro)
      const lastDay = Math.min(now.getDate(), daysInMonth);

      for (let day = 1; day <= lastDay; day++) {
        const dayStr = String(day).padStart(2, '0');
        const currentDateStr = `${currentMonthStr}-${dayStr}`;
        const dayTotal = transactions
          .filter(t => t.data === currentDateStr)
          .reduce((acc, curr) => acc + curr.valor, 0);

        runningBalance += dayTotal;
        // Arredonda após cada soma para manter precisão
        runningBalance = Math.round(runningBalance * 100) / 100;
        data.push({ day: String(day), saldo: runningBalance });
      }

      // Adiciona transações futuras do mês (após hoje) ao último ponto
      // Isso garante que o gráfico mostre o saldo real total
      let futureTrans = 0;
      for (let day = lastDay + 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const currentDateStr = `${currentMonthStr}-${dayStr}`;
        const dayTotal = transactions
          .filter(t => t.data === currentDateStr)
          .reduce((acc, curr) => acc + curr.valor, 0);
        futureTrans += dayTotal;
      }

      // Se há transações futuras, adiciona ao último ponto do gráfico
      if (futureTrans !== 0 && data.length > 0) {
        const finalBalance = Math.round((data[data.length - 1].saldo + futureTrans) * 100) / 100;
        data[data.length - 1].saldo = finalBalance;
      }

      return data;
    } catch (e) {
      return [];
    }
  }, [transactions]);

  // NOVO GRÁFICO: Comparação: Mês Atual vs Mês Anterior
  const comparisonData = useMemo(() => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

      const calculate = (monthStr: string) => {
        const monthTrans = transactions.filter(t => t.data?.startsWith(monthStr));
        return {
          receitas: monthTrans.filter(t => t.valor > 0).reduce((acc, t) => acc + t.valor, 0),
          despesas: Math.abs(monthTrans.filter(t => t.valor < 0).reduce((acc, t) => acc + t.valor, 0))
        };
      };

      const current = calculate(currentMonth);
      const previous = calculate(lastMonth);

      return [
        { mes: 'Mês Anterior', receitas: previous.receitas, despesas: previous.despesas },
        { mes: 'Mês Atual', receitas: current.receitas, despesas: current.despesas }
      ];
    } catch (e) {
      return [];
    }
  }, [transactions]);

  // NOVO GRÁFICO: Top 5 Maiores Receitas e Despesas
  const topTransactionsData = useMemo(() => {
    try {
      const receitas = transactions
        .filter(t => t.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      const despesas = transactions
        .filter(t => t.valor < 0)
        .map(t => ({ ...t, valor: Math.abs(t.valor) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      return { receitas, despesas };
    } catch (e) {
      return { receitas: [], despesas: [] };
    }
  }, [transactions]);

  // Paleta de cores melhorada para gráficos
  const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#10B981', '#F59E0B'];

  // Função para exportar dados para Excel
  const exportToExcel = async () => {
    if (transactions.length === 0) return;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transações');

      worksheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Histórico', key: 'historico', width: 30 },
        { header: 'Origem', key: 'dependenciaOrigem', width: 20 },
        { header: 'Valor (R$)', key: 'valor', width: 15 }
      ];

      transactions.forEach(t => {
        worksheet.addRow({
          data: t.data,
          historico: t.historico,
          dependenciaOrigem: t.dependenciaOrigem,
          valor: t.valor
        });
      });

      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar Excel:", err);
      alert("Erro ao exportar Excel.");
    }
  };

  // Função para imprimir relatório
  const handlePrint = () => {
    window.print();
  };

  // Função para gerar insights com IA Gemini
  const generateAIInsights = async () => {
    if (transactions.length === 0) return;
    setLoadingInsights(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const summaryData = transactions.slice(0, 15).map(t => ({
        data: t.data,
        historico: t.historico,
        valor: t.valor,
        origem: t.dependenciaOrigem
      }));

      const prompt = `Você é um consultor financeiro experiente. Analise brevemente estes dados financeiros (em PT-BR) e dê 3 conselhos práticos e objetivos:\n\n${JSON.stringify(summaryData, null, 2)}\n\nSeja conciso e direto.`;


      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      setInsights(response.text() || 'Sem insights no momento.');
    } catch (error: any) {
      console.error('Erro ao gerar insights:', error);
      setInsights(`Erro: ${error.message || 'Verifique sua chave de API'}.`);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Renderiza erro se houver
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      </div>
    );
  }

  // Renderização principal do componente
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 print:p-0">
      {/* CSS customizado para impressão */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .no-print, header, nav, footer, button { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .grid { display: block !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
          .rounded-2xl { border-radius: 0 !important; }
          .h-\\[400px\\] { height: auto !important; min-height: 350px; page-break-inside: avoid; margin-bottom: 2rem; }
          .print-title { display: block !important; margin-bottom: 2rem; border-bottom: 2px solid #1E3A8A; padding-bottom: 1rem; }
          .recharts-responsive-container { page-break-inside: avoid; }
        }
        .print-title { display: none; }
      `}} />

      {/* Título para impressão */}
      <div className="print-title">
        <h1 className="text-3xl font-bold text-blue-900">Relatório Consolidado de Finanças</h1>
        <p className="text-gray-500">Usuário: {user.name} | Data do Relatório: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Cabeçalho com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análise e Relatórios</h2>
          <p className="text-gray-500">Visualize seus padrões financeiros com clareza.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            disabled={transactions.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 text-sm shadow-sm active:scale-95"
          >
            Excel
          </button>
          <button
            onClick={handlePrint}
            disabled={transactions.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 text-sm shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir PDF
          </button>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 1: Fluxo de Caixa (6 Meses) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Fluxo de Caixa (6 Meses)
          </h3>
          <div className="flex-1 min-h-0">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: number) => [formatCurrency(value), '']} />
                  <Legend iconType="circle" />
                  <Bar dataKey="receita" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados mensais</div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Saldo (Mês Atual) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
            Evolução do Saldo (Mês Atual)
          </h3>
          <div className="flex-1 min-h-0">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: number) => [formatCurrency(value), 'Saldo']} />
                  <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados de tendência</div>
            )}
          </div>
        </div>

        {/* Gráfico 3: Top 5 Gastos por Categoria (BARRAS) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
            Top 5 Gastos por Categoria
          </h3>
          <div className="flex-1 min-h-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                    formatter={(value: number) => [formatCurrency(value), 'Gasto Total']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">Sem despesas registradas</div>
            )}
          </div>
        </div>

        {/* NOVO Gráfico 4: Compar ação Mensal */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
            Comparação: Mês Atual vs Anterior
          </h3>
          <div className="flex-1 min-h-0">
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: number) => [formatCurrency(value), '']} />
                  <Legend iconType="circle" />
                  <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados</div>
            )}
          </div>
        </div>

        {/* Conselheiro IA Gemini */}
        <div className="bg-blue-900 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative flex flex-col h-[400px] no-print lg:col-span-2">
          <div className="relative z-10 h-full flex flex-col">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              Conselheiro IA Gemini
            </h3>
            <p className="text-blue-200 text-sm mb-6">Sugestões estratégicas baseadas no seu perfil.</p>
            <div className="flex-1 bg-blue-800/40 rounded-xl p-5 border border-blue-700/50 mb-6 overflow-y-auto">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-200">Refinando estratégias...</span>
                </div>
              ) : insights ? (
                <div className="text-sm leading-relaxed prose prose-invert max-w-none">
                  {insights.split('\n').map((line, i) => <p key={i} className="mb-3">{line}</p>)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-blue-400 text-sm italic text-center px-4">Pronto para analisar seus dados.</div>
              )}
            </div>
            <button onClick={generateAIInsights} disabled={loadingInsights || transactions.length === 0} className="w-full bg-white text-blue-900 py-3.5 rounded-xl font-bold hover:bg-blue-50 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98] no-print">Gerar Insights</button>
          </div>
        </div>
      </div>

      {/* NOVA Seção: Top Transações */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-6">Top 5 Maiores Transações</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Maiores Receitas */}
          <div>
            <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-4 bg-green-500 rounded-full"></span>
              Maiores Receitas
            </h4>
            <div className="space-y-3">
              {topTransactionsData.receitas.length > 0 ? topTransactionsData.receitas.map((t, i) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{t.historico}</div>
                    <div className="text-xs text-gray-500">{t.dependenciaOrigem} • {t.data}</div>
                  </div>
                  <div className="font-bold text-green-600 text-sm">{formatCurrency(t.valor)}</div>
                </div>
              )) : <p className="text-gray-400 text-sm italic text-center py-8">Nenhuma receita registrada</p>}
            </div>
          </div>

          {/* Maiores Despesas */}
          <div>
            <h4 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-4 bg-red-500 rounded-full"></span>
              Maiores Despesas
            </h4>
            <div className="space-y-3">
              {topTransactionsData.despesas.length > 0 ? topTransactionsData.despesas.map((t, i) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{t.historico}</div>
                    <div className="text-xs text-gray-500">{t.dependenciaOrigem} • {t.data}</div>
                  </div>
                  <div className="font-bold text-red-600 text-sm">{formatCurrency(t.valor)}</div>
                </div>
              )) : <p className="text-gray-400 text-sm italic text-center py-8">Nenhuma despesa registrada</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};