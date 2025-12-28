
// Componente principal da aplicação - CORRIGIDO
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { Goals } from './components/Goals';
import { CalendarView } from './components/CalendarView';
import { UserProfile } from './components/UserProfile';
import { Auth } from './components/Auth';
import { User } from './types';

const App: React.FC = () => {
  // Estados principais
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'goals' | 'calendar' | 'profile'>('dashboard');

  // Verifica se há uma sessão salva ao carregar o app
  useEffect(() => {
    const savedUser = localStorage.getItem('finance_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Função para fazer login do usuário
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('finance_user', JSON.stringify(userData));
  };

  // Função para fazer logout do usuário
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('finance_user');
  };

  // Função para atualizar dados do usuário (incluindo avatar)
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('finance_user', JSON.stringify(updatedUser));
  };

  // Tela de loading enquanto verifica a sessão
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de autenticação
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Renderiza layout principal com as diferentes views
  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      {currentView === 'dashboard' && <Dashboard user={user} />}
      {currentView === 'reports' && <Reports user={user} />}
      {currentView === 'goals' && <Goals user={user} />}
      {currentView === 'calendar' && <CalendarView user={user} />}
      {currentView === 'profile' && <UserProfile user={user} onUpdateUser={handleUpdateUser} />}
    </Layout>
  );
};

export default App;
