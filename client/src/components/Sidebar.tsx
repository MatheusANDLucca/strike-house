import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  ClipboardList,
  WalletCards,
  Award,
  Receipt,
  LogOut,
  X,
  ShieldCheck,
  GraduationCap,
  Flame,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'enrollments'
  | 'billing'
  | 'graduations'
  | 'expenses';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleDownloadBackup = async () => {
    if (isBackingUp) return;
    try {
      setIsBackingUp(true);
      setBackupFeedback(null);

      const token = localStorage.getItem('strikehouse_token') || '';
      if (!token) {
        setBackupFeedback({
          type: 'error',
          message: 'Sessão expirada. Faça login novamente.',
        });
        return;
      }

      const response = await fetch(`/api/backup?token=${encodeURIComponent(token)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMsg = `Erro ${response.status}`;
        try {
          const json = await response.json();
          if (json.error) errorMsg = json.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `strike_house_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setBackupFeedback({
        type: 'success',
        message: 'Backup SQLite baixado!',
      });
      setTimeout(() => setBackupFeedback(null), 3500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar backup.';
      setBackupFeedback({
        type: 'error',
        message: msg,
      });
      setTimeout(() => setBackupFeedback(null), 4000);
    } finally {
      setIsBackingUp(false);
    }
  };

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as NavTab, label: 'Alunos', icon: Users },
    { id: 'classes' as NavTab, label: 'Turmas & Horários', icon: CalendarRange },
    { id: 'enrollments' as NavTab, label: 'Matrículas', icon: ClipboardList },
    { id: 'billing' as NavTab, label: 'Mensalidades', icon: WalletCards },
    { id: 'graduations' as NavTab, label: 'Graduações', icon: Award },
    ...(isAdmin
      ? [{ id: 'expenses' as NavTab, label: 'Despesas', icon: Receipt }]
      : []),
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Overlay escuro em dispositivos móveis */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Barra Lateral Fixa */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#2A3654] bg-[#0B0E14] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo / Marca com Ícone Dark Tech */}
        <div className="flex h-16 items-center justify-between border-b border-[#2A3654] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-white shadow-glow-primary">
              <Flame className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white">
                STRIKE<span className="text-red-500">HOUSE</span>
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Combat Ops v1.0
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#171F30] hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Navegação */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navegação Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 font-semibold shadow-[0_0_15px_-3px_rgba(239,68,68,0.25)]'
                    : 'text-slate-300 hover:bg-[#111622] hover:text-white hover:border hover:border-[#2A3654]/60'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-150 ${
                    isActive ? 'text-red-400 scale-110' : 'text-slate-400 group-hover:text-red-300'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Rodapé / Informações do Usuário Conectado */}
        <div className="border-t border-[#2A3654] bg-[#111622]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171F30] border border-[#2A3654] text-red-400 font-bold">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SH'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || 'Usuário'}
              </p>
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                    <ShieldCheck className="h-3 w-3" /> ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                    <GraduationCap className="h-3 w-3" /> PROFESSOR
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botão Dark Tech: Backup do Banco de Dados (visível apenas para ADMIN) */}
          {isAdmin && (
            <div className="mt-3">
              <button
                onClick={handleDownloadBackup}
                disabled={isBackingUp}
                title="Efetuar download de segurança da base SQLite com WAL checkpoint"
                className="group flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)] transition-all hover:border-red-400 hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBackingUp ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                ) : (
                  <Database className="h-3.5 w-3.5 text-red-400 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span>{isBackingUp ? 'Gerando Backup...' : 'Backup do Banco'}</span>
              </button>

              {backupFeedback && (
                <div
                  className={`mt-2 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium border ${
                    backupFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {backupFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{backupFeedback.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Alternador de Tema Noite / Dia */}
          <button
            onClick={toggleTheme}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/50 hover:text-white"
            title="Alternar entre modo Noturno e Diurno"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Modo Dia</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-red-500" />
                <span>Modo Noite</span>
              </>
            )}
          </button>

          <button
            onClick={logout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A3654] bg-[#171F30] py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};
