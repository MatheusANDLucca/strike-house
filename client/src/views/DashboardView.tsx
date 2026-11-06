import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  CalendarRange,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  X,
  CreditCard,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DashboardData, MonthlyBill, PaymentMethod } from '../types';

interface DashboardViewProps {
  onNavigateToTab?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab }) => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado para Modal de Pagamento Rápido
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('PIX');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payReference, setPayReference] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.get<DashboardData>('/api/dashboard');
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleOpenPayModal = (bill: MonthlyBill) => {
    setSelectedBill(bill);
    setPayAmount(bill.nominal_amount);
    setPayMethod('PIX');
    setPayNotes('');
    setPayReference('');
    setPaySuccess(null);
  };

  const handleClosePayModal = () => {
    setSelectedBill(null);
    setPaySuccess(null);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      setIsPaying(true);
      await api.post(`/api/billing/bills/${selectedBill.id}/pay`, {
        amount: Number(payAmount),
        method: payMethod,
        notes: payNotes,
        reference_code: payReference,
      });

      setPaySuccess('Pagamento registrado com sucesso!');
      setTimeout(() => {
        handleClosePayModal();
        loadDashboard();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar pagamento.';
      alert(msg);
    } finally {
      setIsPaying(false);
    }
  };

  const formatCurrency = (val: number | undefined | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-red-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Carregando painel de controle...</span>
        </div>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-400">
        <p className="font-semibold">{errorMessage}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-black hover:bg-rose-400"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const metrics = data?.metrics;
  const financial = metrics?.financialSummary;

  return (
    <div className="space-y-6">
      {/* Banner de boas-vindas / Contexto do usuário */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#2A3654] bg-gradient-to-r from-[#111622] via-[#171F30] to-[#111622] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-red-400">
            {isAdmin ? 'Controle Administrativo Global' : 'Painel do Instrutor'}
          </span>
          <h2 className="text-xl font-extrabold text-white sm:text-2xl">
            Bem-vindo, {user?.name || 'Guerreiro'}!
          </h2>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'Visão consolidada de todas as unidades, mensalidades e matrículas ativas.'
              : 'Acompanhe suas turmas designadas, frequência de alunos e pagamentos.'}
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 self-start rounded-lg border border-[#2A3654] bg-[#0B0E14] px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/50 hover:text-white sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Grid de KPIs principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Alunos Ativos"
          value={metrics?.totalStudents ?? 0}
          subtitle="Atletas cadastrados"
          icon={Users}
          variant="red"
        />
        <StatCard
          title="Turmas Ativas"
          value={metrics?.activeClassesCount ?? 0}
          subtitle={`${metrics?.activeEnrollmentsCount ?? 0} matrículas`}
          icon={CalendarRange}
          variant="purple"
        />
        <StatCard
          title="Receita Realizada"
          value={formatCurrency(financial?.totalReceived)}
          subtitle="Mensalidades quitadas"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="A Receber (Pendentes)"
          value={formatCurrency(financial?.totalPending)}
          subtitle="Aguardando liquidação"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Em Atraso"
          value={formatCurrency(financial?.totalOverdue)}
          subtitle="Cobranças vencidas"
          icon={AlertTriangle}
          variant="rose"
        />
      </div>

      {/* Seção 2: Mensalidades Urgentes (Vencidas e Pendentes) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cobranças Atrasadas */}
        <div className="rounded-xl border border-[#2A3654] bg-[#111622] p-5 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A3654]">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Mensalidades em Atraso
              </h3>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('billing')}
                className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300"
              >
                <span>Ver todas</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {(!data?.recentOverdueBills || data.recentOverdueBills.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhuma mensalidade em atraso detectada. Excelente!
              </div>
            ) : (
              data.recentOverdueBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#2A3654] bg-[#0B0E14] p-3.5 transition-colors hover:border-rose-500/40"
                >
                  <div>
                    <span className="text-sm font-bold text-white">
                      {bill.student_name || `Matrícula #${bill.enrollment_id}`}
                    </span>
                    <div className="text-xs text-slate-400">
                      Turma: <span className="text-slate-300">{bill.class_name || 'Geral'}</span> &bull; Venceu em:{' '}
                      <span className="text-rose-400 font-mono font-medium">
                        {formatDate(bill.due_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-rose-400">
                      {formatCurrency(bill.nominal_amount)}
                    </span>
                    <button
                      onClick={() => handleOpenPayModal(bill)}
                      className="rounded bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-black transition-colors"
                    >
                      Liquidar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cobranças Pendentes Próximas */}
        <div className="rounded-xl border border-[#2A3654] bg-[#111622] p-5 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A3654]">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Próximos Vencimentos
              </h3>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('billing')}
                className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300"
              >
                <span>Ver todas</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {(!data?.recentPendingBills || data.recentPendingBills.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhum pagamento pendente em aberto para este mês.
              </div>
            ) : (
              data.recentPendingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#2A3654] bg-[#0B0E14] p-3.5 transition-colors hover:border-amber-500/40"
                >
                  <div>
                    <span className="text-sm font-bold text-white">
                      {bill.student_name || `Matrícula #${bill.enrollment_id}`}
                    </span>
                    <div className="text-xs text-slate-400">
                      Turma: <span className="text-slate-300">{bill.class_name || 'Geral'}</span> &bull; Vencimento:{' '}
                      <span className="text-amber-400 font-mono font-medium">
                        {formatDate(bill.due_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-amber-400">
                      {formatCurrency(bill.nominal_amount)}
                    </span>
                    <button
                      onClick={() => handleOpenPayModal(bill)}
                      className="rounded bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Receber
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Seção 3: Turmas Ativas */}
      <div className="rounded-xl border border-[#2A3654] bg-[#111622] p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A3654]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Grade de Turmas Ativas no Dojô
          </h3>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('classes')}
              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300"
            >
              <span>Gerenciar Turmas</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(!data?.classes || data.classes.length === 0) ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              Nenhuma turma ativa cadastrada.
            </div>
          ) : (
            data.classes.map((cls) => {
              const enrolled = cls.enrolled_count || 0;
              const max = cls.max_capacity || 30;
              const percentage = Math.min(100, Math.round((enrolled / max) * 100));

              return (
                <div
                  key={cls.id}
                  className="rounded-lg border border-[#2A3654] bg-[#0B0E14] p-4 transition-all hover:border-red-500/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                        {cls.martial_art_name || 'Artes Marciais'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{cls.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Prof: {cls.professor_name || 'Não atribuído'}
                      </p>
                    </div>
                    <span className="rounded bg-[#171F30] px-2 py-1 text-[11px] font-semibold text-slate-300 border border-[#2A3654]">
                      {cls.age_group === 'CHILD' ? 'Infantil' : cls.age_group === 'ADULT' ? 'Adulto' : 'Misto'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{cls.week_days}</span>
                    <span className="text-slate-200">
                      {cls.start_time} - {cls.end_time}
                    </span>
                  </div>

                  {/* Barra de Ocupação */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Ocupação</span>
                      <span className="font-semibold text-slate-200">
                        {enrolled} / {max} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#171F30] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentage > 90
                            ? 'bg-rose-500'
                            : percentage > 70
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Pagamento Rápido */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-white text-base">Registrar Pagamento</h3>
              </div>
              <button
                onClick={handleClosePayModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#171F30] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paySuccess ? (
              <div className="py-8 text-center text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="h-12 w-12" />
                <p className="font-bold text-sm">{paySuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayment} className="mt-4 space-y-4">
                <div className="rounded-lg border border-[#2A3654] bg-[#0B0E14] p-3 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aluno:</span>
                    <span className="font-bold text-white">{selectedBill.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Competência:</span>
                    <span className="font-mono text-slate-200">{selectedBill.competence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vencimento:</span>
                    <span className="font-mono text-slate-200">{formatDate(selectedBill.due_date)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="PIX">PIX</option>
                    <option value="MONEY">Dinheiro em Espécie</option>
                    <option value="DEBIT_CARD">Cartão de Débito</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Código de Referência / Comprovante (Opcional)
                  </label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    placeholder="Ex: EndToEnd PIX ou NSU Cartão"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Observações Internas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Ex: Pago com desconto autorizado"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClosePayModal}
                    className="flex-1 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isPaying ? 'Processando...' : 'Confirmar Baixa'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
