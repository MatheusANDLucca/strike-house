import React, { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  Search,
  RefreshCw,
  X,
  Tag,
  AlertOctagon,
} from 'lucide-react';
import { api } from '../services/api';
import type { Expense } from '../types';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    description: '',
    category: 'Manutenção / Limpeza',
    amount: '' as string | number,
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const categories = [
    'Aluguel / Imóvel',
    'Energia / Água / Internet',
    'Equipamentos / Tatames / Sacos',
    'Manutenção / Limpeza',
    'Marketing / Mídia',
    'Administrativo / Software',
    'Outros',
  ];

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Expense[]>('/api/expenses', {
        category: selectedCategory || undefined,
      });
      setExpenses(res || []);
    } catch (err) {
      console.error('Erro ao listar despesas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleOpenCreate = () => {
    setForm({
      description: '',
      category: 'Manutenção / Limpeza',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      alert('Preencha a descrição e o valor da despesa.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/expenses', {
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes,
      });

      setIsModalOpen(false);
      loadExpenses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar despesa.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredExpenses = expenses.filter((exp) => {
    const desc = exp.description.toLowerCase();
    const cat = exp.category.toLowerCase();
    const term = searchTerm.toLowerCase();
    return desc.includes(term) || cat.includes(term);
  });

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Card de Resumo de Saídas */}
      <div className="rounded-xl border border-rose-500/30 bg-[#111622] p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Total de Despesas no Período
          </span>
          <div className="mt-1 text-3xl font-extrabold text-white">
            {formatCurrency(totalFiltered)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {filteredExpenses.length} lançamentos operacionais computados
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 self-start rounded-lg bg-rose-500 px-4 py-2.5 text-xs font-bold text-black transition-colors hover:bg-rose-400 sm:self-auto shadow-glow-danger"
        >
          <Plus className="h-4 w-4" />
          <span>Lançar Nova Despesa</span>
        </button>
      </div>

      {/* Top Bar e Filtros */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A3654] bg-[#111622] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar despesa ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tech-input block w-full rounded-lg pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="tech-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadExpenses}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A3654] bg-[#0B0E14] text-slate-300 hover:text-white self-end sm:self-auto"
          title="Atualizar lista"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
        </button>
      </div>

      {/* Tabela de Despesas */}
      <div className="overflow-hidden rounded-xl border border-[#2A3654] bg-[#111622] shadow-xl">
        {isLoading && filteredExpenses.length === 0 ? (
          <div className="py-20 text-center text-xs text-red-400">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Carregando saídas financeiras...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Nenhuma despesa localizada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A3654] bg-[#0B0E14] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Descrição do Custo</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5">Data da Saída</th>
                  <th className="px-4 py-3.5">Valor da Despesa</th>
                  <th className="px-4 py-3.5">Lançado por</th>
                  <th className="px-4 py-3.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3654]/50">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-[#171F30]/50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">{exp.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Registro #{exp.id}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-[#171F30] px-2 py-0.5 text-xs font-semibold text-slate-300 border border-[#2A3654]">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {formatDate(exp.expense_date)}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-sm font-bold text-rose-400">
                      - {formatCurrency(exp.amount)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      {exp.created_by_user_name || 'Admin'}
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Despesa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Registrar Nova Despesa</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#171F30] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Descrição do Custo
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Aquisição de 10 pares de luvas Muay Thai 14oz"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Categoria da Despesa
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-sm font-semibold text-rose-400 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Data da Saída
                  </label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Observações / Fornecedor / NF
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Fornecedor FightGear, NF 94821"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2.5 font-semibold text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-rose-500 py-2.5 font-bold text-black hover:bg-rose-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
