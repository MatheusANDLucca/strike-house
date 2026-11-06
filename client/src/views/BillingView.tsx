import React, { useEffect, useState, useCallback } from 'react';
import {
  WalletCards,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  PlusCircle,
  RefreshCw,
  X,
  FileText,
  BadgePercent,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { MonthlyBill, MonthlyBillStatus, PaymentMethod, FinancialSummary } from '../types';

export const BillingView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const currentMonthStr = new Date().toISOString().slice(0, 7); // AAAA-MM
  const [competenceFilter, setCompetenceFilter] = useState<string>(currentMonthStr);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Gerar Lote (Admin)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchCompetence, setBatchCompetence] = useState(currentMonthStr);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  // Modal Pagamento
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('PIX');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [billsRes, sumRes] = await Promise.all([
        api.get<MonthlyBill[]>('/api/billing/bills', {
          competence: competenceFilter || undefined,
          status: (statusFilter as MonthlyBillStatus) || undefined,
        }),
        api.get<FinancialSummary>('/api/billing/summary'),
      ]);

      setBills(billsRes || []);
      setSummary(sumRes || null);
    } catch (err) {
      console.error('Erro ao carregar mensalidades:', err);
    } finally {
      setIsLoading(false);
    }
  }, [competenceFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenPay = (bill: MonthlyBill) => {
    setSelectedBill(bill);
    setPayAmount(bill.nominal_amount);
    setPayMethod('PIX');
    setPayReference('');
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      setIsPaying(true);
      await api.post(`/api/billing/bills/${selectedBill.id}/pay`, {
        amount: Number(payAmount),
        method: payMethod,
        reference_code: payReference,
        notes: payNotes,
      });

      setIsPayModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar pagamento.';
      alert(msg);
    } finally {
      setIsPaying(false);
    }
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await api.post<{ generatedCount: number; competence: string }>('/api/billing/generate', {
        competence: batchCompetence,
      });

      setBatchResult(`Sucesso! ${res.generatedCount} mensalidades geradas para a competência ${res.competence}.`);
      setTimeout(() => {
        setIsBatchModalOpen(false);
        setBatchResult(null);
        setCompetenceFilter(batchCompetence);
        loadData();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar lote.';
      alert(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const paymentMethodLabel: Record<PaymentMethod, string> = {
    PIX: 'PIX',
    MONEY: 'Dinheiro',
    DEBIT_CARD: 'Cartão Débito',
    CREDIT_CARD: 'Cartão Crédito',
  };

  const filteredBills = bills.filter((b) => {
    const sName = b.student_name?.toLowerCase() || '';
    const cName = b.class_name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return sName.includes(term) || cName.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Cards de Resumo Rápido */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-500/30 bg-[#111622] p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Total Realizado / Pago
            </span>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {formatCurrency(summary.totalReceived)}
            </div>
            <div className="mt-1 text-xs text-slate-400">Faturas quitadas com sucesso</div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-[#111622] p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Total Pendente
            </span>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {formatCurrency(summary.totalPending)}
            </div>
            <div className="mt-1 text-xs text-slate-400">A vencer no ciclo corrente</div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-[#111622] p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Total em Atraso
            </span>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {formatCurrency(summary.totalOverdue)}
            </div>
            <div className="mt-1 text-xs text-slate-400">Vencimento ultrapassado</div>
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-red-500/30 bg-[#111622] p-4 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                Saldo Líquido Geral
              </span>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {formatCurrency(summary.netBalance)}
              </div>
              <div className="mt-1 text-xs text-slate-400">Receitas deduzidas as despesas</div>
            </div>
          )}
        </div>
      )}

      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A3654] bg-[#111622] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Busca por Aluno */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno ou turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tech-input block w-full rounded-lg pl-9 pr-3 py-2 text-xs"
            />
          </div>

          {/* Competência */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold uppercase">Mês:</span>
            <input
              type="month"
              value={competenceFilter}
              onChange={(e) => setCompetenceFilter(e.target.value)}
              className="tech-input rounded-lg px-3 py-1.5 text-xs font-mono"
            />
            {competenceFilter && (
              <button
                onClick={() => setCompetenceFilter('')}
                className="text-[10px] text-slate-400 hover:text-white"
                title="Limpar filtro de mês"
              >
                Todos
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tech-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="">Todos os Status</option>
            <option value="PENDING">Pendentes</option>
            <option value="PAID">Pagas / Liquidadas</option>
            <option value="OVERDUE">Em Atraso</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A3654] bg-[#0B0E14] text-slate-300 hover:text-white"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setBatchCompetence(currentMonthStr);
                setBatchResult(null);
                setIsBatchModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-black transition-colors hover:bg-emerald-400 shadow-glow-success"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Gerar Lote de Mensalidades</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Mensalidades */}
      <div className="overflow-hidden rounded-xl border border-[#2A3654] bg-[#111622] shadow-xl">
        {isLoading && filteredBills.length === 0 ? (
          <div className="py-20 text-center text-xs text-red-400">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Carregando cobranças financeiras...
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Nenhuma fatura encontrada para este período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A3654] bg-[#0B0E14] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Fatura / Aluno</th>
                  <th className="px-4 py-3.5">Turma</th>
                  <th className="px-4 py-3.5">Competência</th>
                  <th className="px-4 py-3.5">Vencimento</th>
                  <th className="px-4 py-3.5">Valor Nominal</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Quitação</th>
                  <th className="px-4 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3654]/50">
                {filteredBills.map((bill) => {
                  const isPaid = bill.status === 'PAID';
                  const isOverdue = bill.status === 'OVERDUE';
                  const isPending = bill.status === 'PENDING';

                  return (
                    <tr key={bill.id} className="transition-colors hover:bg-[#171F30]/50">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          {bill.student_name || 'Aluno Desconhecido'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID #{bill.id} &bull; Matrícula #{bill.enrollment_id}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{bill.class_name || '-'}</div>
                        <div className="text-[11px] text-slate-400">
                          Prof: {bill.professor_name || '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300 font-semibold">
                        {bill.competence}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {formatDate(bill.due_date)}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-sm font-bold text-white">
                        {formatCurrency(bill.nominal_amount)}
                      </td>

                      <td className="px-4 py-3.5">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-400 border border-emerald-500/20 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> Pago
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-400 border border-rose-500/20 text-[11px]">
                            <AlertTriangle className="h-3 w-3" /> Vencida
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-400 border border-amber-500/20 text-[11px]">
                            <Clock className="h-3 w-3" /> Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[11px]">
                        {isPaid ? (
                          <div className="text-slate-300">
                            <div>
                              Pago: <span className="font-bold text-emerald-400">{formatCurrency(bill.amount_paid)}</span>
                            </div>
                            <div className="text-slate-400">
                              {formatDate(bill.payment_date)} ({bill.payment_method ? paymentMethodLabel[bill.payment_method] : 'Diversos'})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Em aberto</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handleOpenPay(bill)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500 transition-colors shadow-glow-primary"
                          >
                            Dar Baixa
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs font-medium">Liquidado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Gerar Lote de Mensalidades (Apenas ADMIN) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Gerar Lote de Mensalidades</h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#171F30] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {batchResult ? (
              <div className="py-8 text-center text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="h-10 w-10" />
                <p className="font-bold text-sm">{batchResult}</p>
              </div>
            ) : (
              <form onSubmit={handleGenerateBatch} className="mt-4 space-y-4 text-xs">
                <p className="text-slate-400">
                  O sistema gerará automaticamente as faturas para todas as matrículas <span className="text-emerald-400 font-bold">ATIVAS</span> na competência selecionada, calculando a data de vencimento com base no dia acordado de cada atleta.
                </p>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Competência (Mês / Ano)
                  </label>
                  <input
                    type="month"
                    value={batchCompetence}
                    onChange={(e) => setBatchCompetence(e.target.value)}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-sm font-mono"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="flex-1 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2.5 font-semibold text-slate-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 rounded-lg bg-emerald-500 py-2.5 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isGenerating ? 'Processando Lote...' : 'Gerar Mensalidades'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pagamento / Baixa */}
      {isPayModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-white text-base">Registrar Pagamento</h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#171F30] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-lg border border-[#2A3654] bg-[#0B0E14] p-3 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Aluno:</span>
                  <span className="font-bold text-white">{selectedBill.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turma:</span>
                  <span className="text-slate-200">{selectedBill.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Competência:</span>
                  <span className="font-mono text-slate-200">{selectedBill.competence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data de Vencimento:</span>
                  <span className="font-mono text-slate-200">{formatDate(selectedBill.due_date)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Valor Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm font-semibold text-emerald-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Método de Liquidação
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                >
                  <option value="PIX">PIX</option>
                  <option value="MONEY">Dinheiro em Espécie</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Código de Autenticação / TXID (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Identificador PIX ou comprovante maquininha"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Autorizado desconto promocional"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2.5 font-semibold text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="flex-1 rounded-lg bg-emerald-500 py-2.5 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isPaying ? 'Liquidando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
