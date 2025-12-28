
import React, { useState, useEffect } from 'react';
import { User, Goal, Transaction } from '../types';
import { apiService } from '../services/api';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GoalsProps {
  user: User;
}

export const Goals: React.FC<GoalsProps> = ({ user }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ titulo: '', valorMeta: '', cor: '#2563EB' });

  // AI State
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsData, transactionsData] = await Promise.all([
          apiService.getGoals(user.id),
          apiService.getTransactions(user.id)
        ]);
        if (Array.isArray(goalsData)) setGoals(goalsData);
        if (Array.isArray(transactionsData)) setTransactions(transactionsData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };
    fetchData();
  }, [user.id]);

  const loadGoals = async () => {
    try {
      const data = await apiService.getGoals(user.id);
      if (Array.isArray(data)) setGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Removed saveGoals local storage helper

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.titulo || !newGoal.valorMeta) return;

    try {
      await apiService.addGoal(user.id, {
        titulo: newGoal.titulo,
        valorMeta: parseFloat(newGoal.valorMeta),
        cor: newGoal.cor
      });
      loadGoals();
      setIsAdding(false);
      setNewGoal({ titulo: '', valorMeta: '', cor: '#2563EB' });
    } catch (err) {
      alert("Erro ao adicionar meta.");
    }
  };

  const updateGoalProgress = async (id: string, amount: number) => {
    try {
      await apiService.updateGoal(user.id, id, amount);
      loadGoals();
    } catch (err) {
      alert("Erro ao atualizar progresso.");
    }
  };

  const deleteGoal = async (id: string) => {
    if (confirm('Deseja excluir esta meta?')) {
      try {
        await apiService.deleteGoal(user.id, id);
        loadGoals();
      } catch (err) {
        alert("Erro ao excluir meta.");
      }
    }
  };

  const generateGoalAIPlanner = async () => {
    if (goals.length === 0) {
      setAiAdvice("Crie pelo menos uma meta para que eu possa te ajudar com o planejamento!");
      return;
    }
    setLoadingAi(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

      const context = {
        metas: goals.map(g => ({ titulo: g.titulo, alvo: g.valorMeta, atual: g.valorAtual })),
        saldoEstimado: transactions.reduce((acc, t) => acc + t.valor, 0)
      };

      const prompt = `Analise minhas metas financeiras e sugira um plano de ação:\n\n${JSON.stringify(context, null, 2)}\n\nForneça 3 passos realistas.`;


      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      setAiAdvice(response.text() || 'Não consegui gerar um plano agora.');
    } catch (error: any) {
      console.error(error);
      setAiAdvice(`Erro: ${error.message || 'Verifique sua conexão'}.`);
    } finally {
      setLoadingAi(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suas Metas</h2>
          <p className="text-gray-500">Transforme sonhos em planos concretos.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center"
        >
          Nova Meta
        </button>
      </div>

      {/* AI Planner Section - Updated to match Reports.tsx style */}
      <div className="bg-blue-900 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <span className="p-1 bg-blue-700 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            Mentor de Planejamento IA
          </h3>
          <p className="text-blue-200 text-sm mb-6">
            Receba um plano estratégico personalizado para atingir seus objetivos financeiros.
          </p>

          {aiAdvice && (
            <div className="flex-1 bg-blue-800/50 rounded-lg p-4 border border-blue-700 mb-6 animate-in slide-in-from-top-4 duration-300">
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                {aiAdvice.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={generateGoalAIPlanner}
            disabled={loadingAi}
            className="w-full bg-white text-blue-900 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loadingAi ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin"></div>
                Criando Plano...
              </>
            ) : 'Gerar Plano de Ação'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-xl animate-in slide-in-from-top-4 duration-300 relative">
          <button
            onClick={() => setIsAdding(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="font-bold text-xl mb-6 text-gray-900">Configurar Objetivo</h3>
          <form onSubmit={handleAddGoal} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título do Objetivo</label>
              <input
                type="text"
                required
                placeholder="Ex: Reserva de Emergência, Viagem para Europa..."
                value={newGoal.titulo}
                onChange={(e) => setNewGoal({ ...newGoal, titulo: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Alvo (R$)</label>
              <input
                type="number"
                required
                placeholder="5000"
                value={newGoal.valorMeta}
                onChange={(e) => setNewGoal({ ...newGoal, valorMeta: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Criar Meta
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="md:col-span-3 py-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-bold text-xl mb-2">Sem metas no momento</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">Comece agora mesmo a planejar seus sonhos financeiros.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-blue-600 font-bold hover:underline"
            >
              Clique aqui para criar sua primeira meta
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min(100, (goal.valorAtual / goal.valorMeta) * 100);
            return (
              <div key={goal.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-gray-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{goal.titulo}</h3>
                <p className="text-xs text-gray-400 mb-6 uppercase tracking-widest font-bold">Objetivo Alcançado: {percentage.toFixed(0)}%</p>

                <div className="mt-auto space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm items-end">
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(goal.valorAtual)}</span>
                      <span className="text-xs text-gray-400 font-medium mb-1">de {formatCurrency(goal.valorMeta)}</span>
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 shadow-sm"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.cor
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => updateGoalProgress(goal.id, 100)}
                      className="py-3 px-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100 active:scale-95"
                    >
                      + R$ 100
                    </button>
                    <button
                      onClick={() => updateGoalProgress(goal.id, 500)}
                      className="py-3 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                      + R$ 500
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
