
import React, { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (!isLogin && !name)) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (isLogin) {
        response = await apiService.login({ email, password });
      } else {
        response = await apiService.register({ name, email, password });
      }

      if (response.success) {
        onLogin(response.user);
      } else {
        setError(response.error || 'Erro na autenticação.');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-stretch bg-white">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-1 bg-blue-900 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-800 rounded-full -ml-48 -mb-48 opacity-30"></div>

        <div className="z-10">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8 shadow-xl">
            <span className="text-blue-900 font-bold text-xl">CF</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-4">Gerencie seu dinheiro com facilidade.</h1>
          <p className="text-blue-100 text-lg max-w-md">Controle de Finanças é a ferramenta completa para organizar suas transações e planejar seu futuro financeiro.</p>
        </div>

        <div className="z-10 grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
            <h4 className="font-bold text-xl">100%</h4>
            <p className="text-sm text-blue-200">Seguro</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
            <h4 className="font-bold text-xl">Grátis</h4>
            <p className="text-sm text-blue-200">Para uso pessoal</p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CF</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-gray-500 mb-8">
            {isLogin ? 'Entre com seus dados para acessar o painel.' : 'Junte-se a nós e comece a economizar hoje.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                {isLogin && <button type="button" className="text-xs text-blue-600 hover:underline">Esqueceu a senha?</button>}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-500 text-sm">
            {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'} {' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? 'Crie uma agora' : 'Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
