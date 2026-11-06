import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { ClassesView } from './views/ClassesView';
import { EnrollmentsView } from './views/EnrollmentsView';
import { BillingView } from './views/BillingView';
import { GraduationsView } from './views/GraduationsView';
import { ExpensesView } from './views/ExpensesView';
import { Flame, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E14] text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-glow-primary animate-pulse mb-4">
          <Flame className="h-8 w-8 stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-2 text-sm text-red-400 font-semibold tracking-wide">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Iniciando Strike House Ops...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigateToTab={(tab) => setCurrentTab(tab)} />;
      case 'students':
        return <StudentsView />;
      case 'classes':
        return <ClassesView />;
      case 'enrollments':
        return <EnrollmentsView />;
      case 'billing':
        return <BillingView />;
      case 'graduations':
        return <GraduationsView />;
      case 'expenses':
        return isAdmin ? <ExpensesView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-slate-100">
      {/* Barra Lateral */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Central / Conteúdo Principal */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default App;
