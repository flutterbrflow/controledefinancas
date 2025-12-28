import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction } from '../types';
import { apiService } from '../services/api';
import { GoogleGenAI } from "@google/genai";
import * as ExcelJS from 'exceljs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface ReportsProps {
  user: User;
}

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const monthlyData = useMemo(() => {
    try {
      const months: Record<string, { month: string, receita: number, despesa: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' });
        months[key] = { month: label, receita: 0, despesa: 0 };
      }
      transactions.forEach(t => {
        if (!t.data) return;
        // Parse YYYY-MM-DD sem Date object para evitar fuso horário
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

  const categoryData = useMemo(() => {
    try {
      const totals: Record<string, number> = {};
      transactions.filter(t => t.valor < 0).forEach(t => {
        const cat = t.dependenciaOrigem || 'Outros';
        totals[cat] = (totals[cat] || 0) + Math.abs(t.valor);
      });
      return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
    } catch (e) {
      return [];
    }
  }, [transactions]);

  const trendData = useMemo(() => {
    try {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const data = [];
      let runningBalance = 0;

      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      transactions.forEach(t => {
        if (!t.data) return;
        const parts = t.data.split('-');
        if (parts.length < 2) return;
        const transMonthStr = `${parts[0]}-${parts[1]}`;

        // Se a transação for de meses anteriores, entra no saldo inicial
        if (transMonthStr < currentMonthStr) {
          runningBalance += t.valor;
        }
      });

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const currentDateStr = `${currentMonthStr}-${dayStr}`;

        const dayTotal = transactions
          .filter(t => t.data === currentDateStr)
          .reduce((acc, curr) => acc + curr.valor, 0);

        runningBalance += dayTotal;
        data.push({ day: String(day), saldo: runningBalance });

        // Para o gráfico no dia de hoje (se for o mês atual)
        if (day === now.getDate() && now.getMonth() === new Date().getMonth()) break;
      }
      return data;
    } catch (e) {
      return [];
    }
  }, [transactions]);

  const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

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

  const handlePrint = () => {
    window.print();
  };

  const generateAIInsights = async () => {
    if (transactions.length === 0) return;
    setLoadingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const summaryData = transactions.slice(0, 15).map(t => ({
        d: t.data,
        h: t.historico,
        v: t.valor,
        o: t.dependenciaOrigem
      }));
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise brevemente estes dados financeiros (em PT-BR) e dê 3 conselhos rápidos: ${JSON.stringify(summaryData)}`,
        config: { systemInstruction: "Você é um consultor financeiro. Seja conciso." }
      });
      setInsights(response.text || 'Sem insights no momento.');
    } catch (error) {
      setInsights('Erro ao processar insights com IA.');
    } finally {
      setLoadingInsights(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 print:p-0">
      {/* Estilos customizados para impressão */}
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

      <div className="print-title">
        <h1 className="text-3xl font-bold text-blue-900">Relatório Consolidado de Finanças</h1>
        <p className="text-gray-500">Usuário: {user.name} | Data do Relatório: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="receita" name="Receita" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados mensais</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
            Saldo (Mês Atual)
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                    formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                  />
                  <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados de tendência</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
            Maiores Gastos por Origem
          </h3>
          <div className="flex-1 min-h-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">Sem despesas registradas</div>
            )}
          </div>
        </div>

        <div className="bg-blue-900 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative flex flex-col h-[400px] no-print">
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
    </div>
  );
};