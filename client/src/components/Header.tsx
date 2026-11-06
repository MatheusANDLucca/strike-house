import React from 'react';
import { Menu, Activity, Calendar, Sun, Moon } from 'lucide-react';
import type { NavTab } from './Sidebar';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Visão Geral Operacional',
    subtitle: 'Métricas em tempo real de alunos, turmas e fluxo de receita',
  },
  students: {
    title: 'Gestão de Alunos',
    subtitle: 'Cadastro, controle cadastral e responsáveis legais',
  },
  classes: {
    title: 'Grade de Turmas & Modalidades',
    subtitle: 'Horários, capacidade, instrutores e artes marciais',
  },
  enrollments: {
    title: 'Matrículas & Planos',
    subtitle: 'Vínculo de alunos às turmas com regras de vencimento',
  },
  billing: {
    title: 'Central Financeira & Cobranças',
    subtitle: 'Lançamentos, liquidação de mensalidades e conciliação',
  },
  graduations: {
    title: 'Graduações & Faixas',
    subtitle: 'Progressão técnica e histórico marcial dos atletas',
  },
  expenses: {
    title: 'Controle de Despesas',
    subtitle: 'Registro de saídas operacionais e custos de manutenção',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenMobileMenu }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const currentMeta = tabTitles[currentTab] || {
    title: 'Strike House',
    subtitle: 'Sistema de Gestão de Artes Marciais',
  };

  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#2A3654] bg-[#0B0E14]/90 px-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A3654] bg-[#111622] text-slate-300 hover:text-white lg:hidden"
          aria-label="Abrir Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-white md:text-lg">
            {currentMeta.title}
          </h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Alternador de Tema Dia / Noite */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Alternar para Modo Dia (Claro)' : 'Alternar para Modo Noite (Escuro)'}
          className="flex h-9 items-center gap-2 rounded-lg border border-[#2A3654] bg-[#111622] px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/50 hover:text-white"
          aria-label="Alternar tema"
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Dia</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-red-500" />
              <span className="hidden sm:inline">Noite</span>
            </>
          )}
        </button>

        {/* Data Corrente */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span className="capitalize">{todayStr}</span>
        </div>

        {/* Status de Operação */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="hidden md:inline">SISTEMA ATIVO</span>
          <Activity className="h-3.5 w-3.5 md:hidden" />
        </div>
      </div>
    </header>
  );
};
