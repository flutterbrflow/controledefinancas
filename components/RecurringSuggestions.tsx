
// Componente de Sugestões de Transações Recorrentes
// Analisa o histórico e sugere contas que podem ser cadastradas como recorrentes
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface Suggestion {
    titulo: string;
    origem: string;
    valorMedio: number;
    diaSugerido: number;
    ocorrencias: number;
    consistencia: number;
}

interface RecurringSuggestionsProps {
    user: User;
}

export const RecurringSuggestions: React.FC<RecurringSuggestionsProps> = ({ user }) => {
    // Estados
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);

    // Carrega sugestões ao montar o componente
    useEffect(() => {
        loadSuggestions();
    }, [user.id]);

    // Função para carregar sugestões da API
    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const data = await apiService.getSuggestedRecurring(user.id);
            setSuggestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Erro ao carregar sugestões:', err);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    // Função para aceitar uma sugestão e criar transação recorrente
    const handleAcceptSuggestion = async (index: number, suggestion: Suggestion) => {
        setProcessing(index);

        try {
            await apiService.addRecurring(user.id, {
                titulo: suggestion.titulo,
                valor: -Math.abs(suggestion.valorMedio), // Negativo para despesa
                diaVencimento: suggestion.diaSugerido,
                categoria: 'Sugerida'
            });

            // Remove a sugestão da lista após aceitar
            setSuggestions(prev => prev.filter((_, i) => i !== index));
            alert('✅ Conta recorrente adicionada com sucesso!');
        } catch (err: any) {
            alert('❌ Erro ao adicionar conta: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setProcessing(null);
        }
    };

    // Função para rejeitar uma sugestão
    const handleRejectSuggestion = (index: number) => {
        setSuggestions(prev => prev.filter((_, i) => i !== index));
    };

    // Função para formatar moeda
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Sugestões de Contas Recorrentes</h3>
                    <p className="text-sm text-gray-500">Baseado no seu histórico de transações</p>
                </div>
                <button
                    onClick={loadSuggestions}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Atualizar
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Analisando padrões...</span>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Nenhuma sugestão encontrada. Continue adicionando transações para que possamos identificar padrões!
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all animate-in slide-in-from-left-2 duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 truncate">{suggestion.titulo}</h4>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0">
                                            {suggestion.consistencia}% confiável
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500 mb-3">{suggestion.origem}</p>

                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-gray-400 mb-1">Valor Médio</div>
                                            <div className="font-bold text-red-600">{formatCurrency(suggestion.valorMedio)}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-gray-400 mb-1">Dia Sugerido</div>
                                            <div className="font-bold text-gray-900">{suggestion.diaSugerido}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-gray-400 mb-1">Ocorrências</div>
                                            <div className="font-bold text-gray-900">{suggestion.ocorrencias}x</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleAcceptSuggestion(index, suggestion)}
                                        disabled={processing === index}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {processing === index ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            '✓ Adicionar'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleRejectSuggestion(index)}
                                        disabled={processing === index}
                                        className="text-gray-400 hover:text-red-500 text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        ✕ Ignorar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
