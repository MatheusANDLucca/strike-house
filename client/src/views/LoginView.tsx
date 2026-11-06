import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Flame, AlertCircle, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@strikehouse.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, informe seu email e senha de acesso.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciais inválidas ou erro no servidor.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] px-4 py-12 relative overflow-hidden">
      {/* Botão de Tema no Login */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 rounded-lg border border-[#2A3654] bg-[#111622] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/50 hover:text-white"
        title="Alternar tema"
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Modo Dia</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">Modo Noite</span>
          </>
        )}
      </button>

      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-red-500/10 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-40 right-10 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-glow-primary mb-4">
            <Flame className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            STRIKE<span className="text-red-500">HOUSE</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sistema Integrado de Gestão e Operações Marciais
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="rounded-2xl border border-[#2A3654] bg-[#111622] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Entrar na Plataforma</h2>
            <p className="text-xs text-slate-400">
              Digite seu email e senha cadastrados para acessar o painel.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@strikehouse.com"
                  className="tech-input block w-full rounded-lg pl-10 pr-3 py-2.5 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="tech-input block w-full rounded-lg pl-10 pr-10 py-2.5 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-bold text-white transition-all hover:bg-red-500 active:scale-[0.99] disabled:opacity-50 shadow-glow-primary"
            >
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Acessar Painel</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalho de Demonstração / Credenciais Padrão */}
          <div className="mt-6 pt-5 border-t border-[#2A3654]/60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
              <span>Acesso Inicial Rápido:</span>
            </div>
            <button
              type="button"
              onClick={() => setCredentials('admin@strikehouse.com', 'admin123')}
              className="w-full text-left rounded border border-[#2A3654] bg-[#0B0E14] px-3 py-2 text-[11px] font-mono text-slate-300 hover:border-red-500/50 hover:text-white transition-colors flex items-center justify-between"
            >
              <span>admin@strikehouse.com / admin123</span>
              <span className="text-[10px] text-red-400 font-sans uppercase font-bold">Usar</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Strike House &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
