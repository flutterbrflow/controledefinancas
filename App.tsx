
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { Goals } from './components/Goals';
import { CalendarView } from './components/CalendarView';
import { Auth } from './components/Auth';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'goals' | 'calendar'>('dashboard');

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('finance_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('finance_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('finance_user');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

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
    </Layout>
  );
};

export default App;
