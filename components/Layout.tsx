
// Componente de Layout - estrutura principal da aplicação
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: 'dashboard' | 'reports' | 'goals' | 'calendar' | 'profile';
  onViewChange: (view: 'dashboard' | 'reports' | 'goals' | 'calendar' | 'profile') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onViewChange }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('dashboard')}>
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">CF</span>
              </div>
              <h1 className="font-bold text-xl sm:text-2xl text-gray-900 truncate">
                Controle de Finanças
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8 h-full">
              <button
                onClick={() => onViewChange('dashboard')}
                className={`flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${currentView === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onViewChange('reports')}
                className={`flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${currentView === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                  }`}
              >
                Relatórios
              </button>
              <button
                onClick={() => onViewChange('calendar')}
                className={`flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${currentView === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                  }`}
              >
                Agenda
              </button>
              <button
                onClick={() => onViewChange('goals')}
                className={`flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${currentView === 'goals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                  }`}
              >
                Metas
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={onLogout}
                className="hidden sm:block text-gray-500 hover:text-red-600 text-sm transition-colors"
              >
                Sair
              </button>
              <div
                onClick={() => onViewChange('profile')}
                className="flex items-center gap-3 bg-gray-50 pl-3 pr-1 py-1 rounded-full border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 hidden lg:inline">{user.name}</span>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-900">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex justify-around bg-white border-b border-gray-100 p-2 text-xs font-medium text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button onClick={() => onViewChange('dashboard')} className={`px-2 ${currentView === 'dashboard' ? 'text-blue-600' : ''}`}>Dashboard</button>
        <button onClick={() => onViewChange('reports')} className={`px-2 ${currentView === 'reports' ? 'text-blue-600' : ''}`}>Relatórios</button>
        <button onClick={() => onViewChange('calendar')} className={`px-2 ${currentView === 'calendar' ? 'text-blue-600' : ''}`}>Agenda</button>
        <button onClick={() => onViewChange('goals')} className={`px-2 ${currentView === 'goals' ? 'text-blue-600' : ''}`}>Metas</button>
        <button onClick={() => onViewChange('profile')} className={`px-2 ${currentView === 'profile' ? 'text-blue-600' : ''}`}>Perfil</button>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Controle de Finanças - Gestão inteligente para o seu bolso.
        </div>
      </footer>
    </div>
  );
};
