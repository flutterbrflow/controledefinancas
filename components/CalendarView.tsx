
import React, { useState, useEffect } from 'react';
import { User, Transaction, RecurringTransaction } from '../types';
import { apiService } from '../services/api';

interface CalendarViewProps {
  user: User;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [newRec, setNewRec] = useState({ titulo: '', valor: '', dia: '10', categoria: 'Fixo' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transData, recData] = await Promise.all([
          apiService.getTransactions(user.id),
          apiService.getRecurring(user.id)
        ]);
        if (Array.isArray(transData)) setTransactions(transData);
        if (Array.isArray(recData)) setRecurring(recData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };
    fetchData();
  }, [user.id]);

  const loadRecurring = async () => {
    try {
      const data = await apiService.getRecurring(user.id);
      if (Array.isArray(data)) setRecurring(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Função para formatar valores em moeda brasileira
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Removed saveRecurring local storage helper

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addRecurring(user.id, {
        titulo: newRec.titulo,
        valor: parseFloat(newRec.valor),
        diaVencimento: parseInt(newRec.dia),
        categoria: newRec.categoria
      });
      loadRecurring();
      setIsAddingRecurring(false);
      setNewRec({ titulo: '', valor: '', dia: '10', categoria: 'Fixo' });
    } catch (err) {
      alert("Erro ao adicionar conta recorrente.");
    }
  };

  const toggleRecurring = async (id: string) => {
    try {
      await apiService.toggleRecurring(user.id, id);
      loadRecurring();
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  };

  const deleteRecurring = async (id: string) => {
    if (confirm('Excluir esta conta recomendente?')) {
      try {
        await apiService.deleteRecurring(user.id, id);
        loadRecurring();
      } catch (err) {
        alert("Erro ao excluir conta.");
      }
    }
  };

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getDayData = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrans = transactions.filter(t => t.data === dateStr);
    const dayRec = recurring.filter(r => r.diaVencimento === day && r.ativa);
    return { transactions: dayTrans, recurring: dayRec };
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda Financeira</h2>
          <p className="text-gray-500">Acompanhe seus vencimentos e histórico visual.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingRecurring(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center min-w-[160px]"
          >
            Conta Recorrente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
              <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-blue-600 px-2 uppercase">Hoje</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="bg-gray-50 p-2 text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 h-24 sm:h-28"></div>
            ))}
            {Array.from({ length: daysInMonth(currentDate.getMonth(), currentDate.getFullYear()) }).map((_, i) => {
              const day = i + 1;
              const { transactions: dTrans, recurring: dRec } = getDayData(day);
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div key={day} className={`bg-white p-1.5 h-24 sm:h-28 border-t border-gray-50 flex flex-col gap-1 overflow-hidden group hover:bg-blue-50/30 transition-colors ${isToday ? 'bg-blue-50/50' : ''}`}>
                  <span className={`text-[10px] font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>{day}</span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {dRec.map(r => (
                      <div key={r.id} className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded truncate border border-amber-200" title={r.titulo}>
                        {r.titulo}
                      </div>
                    ))}
                    {dTrans.map(t => (
                      <div key={t.id} className={`text-[9px] px-1 py-0.5 rounded truncate border ${t.valor > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {formatCurrency(Math.abs(t.valor))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recurring List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Contas Recorrentes</h3>
          {isAddingRecurring && (
            <form onSubmit={handleAddRecurring} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3 animate-in slide-in-from-top-4 duration-300">
              <input type="text" required placeholder="Título (ex: Netflix)" className="w-full text-sm p-2 rounded border border-gray-200" value={newRec.titulo} onChange={e => setNewRec({ ...newRec, titulo: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required placeholder="Valor" className="w-full text-sm p-2 rounded border border-gray-200" value={newRec.valor} onChange={e => setNewRec({ ...newRec, valor: e.target.value })} />
                <input type="number" min="1" max="31" required placeholder="Dia" className="w-full text-sm p-2 rounded border border-gray-200" value={newRec.dia} onChange={e => setNewRec({ ...newRec, dia: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-bold">Adicionar</button>
                <button type="button" onClick={() => setIsAddingRecurring(false)} className="px-3 text-gray-500 text-sm">Cancelar</button>
              </div>
            </form>
          )}

          <div className="flex-1 space-y-3">
            {recurring.length === 0 ? (
              <p className="text-gray-400 text-sm italic text-center py-8">Nenhuma conta recorrente cadastrada.</p>
            ) : (
              recurring.map(r => (
                <div key={r.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${r.ativa ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-900">{r.titulo}</span>
                    <span className="text-[10px] text-gray-500 font-medium">Dia {r.diaVencimento} • R$ {formatCurrency(r.valor)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRecurring(r.id)} className={`p-1 rounded ${r.ativa ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-200'}`}>
                      {r.ativa ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                    <button onClick={() => deleteRecurring(r.id)} className="p-1 text-gray-300 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
