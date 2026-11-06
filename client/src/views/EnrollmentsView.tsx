import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Calendar,
  DollarSign,
  UserCheck,
  Ban,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import type { Enrollment, Student, ClassItem, EnrollmentStatus } from '../types';

export const EnrollmentsView: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Modal Nova Matrícula
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_id: 0,
    class_id: 0,
    due_day: 10,
    custom_price: '' as string | number,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'ACTIVE' as EnrollmentStatus,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [enrRes, stdRes, clsRes] = await Promise.all([
        api.get<Enrollment[]>('/api/enrollments', {
          status: (statusFilter as EnrollmentStatus) || undefined,
        }),
        api.get<Student[]>('/api/students', { status: 'ACTIVE' }),
        api.get<ClassItem[]>('/api/classes', { activeOnly: true }),
      ]);

      setEnrollments(enrRes || []);
      setStudents(stdRes || []);
      setClasses(clsRes || []);

      if (stdRes && stdRes.length > 0 && !form.student_id) {
        setForm((prev) => ({ ...prev, student_id: stdRes[0].id }));
      }
      if (clsRes && clsRes.length > 0 && !form.class_id) {
        setForm((prev) => ({ ...prev, class_id: clsRes[0].id }));
      }
    } catch (err) {
      console.error('Erro ao listar matrículas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setForm({
      student_id: students[0]?.id || 0,
      class_id: classes[0]?.id || 0,
      due_day: 10,
      custom_price: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.class_id) {
      alert('Selecione um aluno e uma turma válidos.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/enrollments', {
        student_id: Number(form.student_id),
        class_id: Number(form.class_id),
        due_day: Number(form.due_day),
        custom_price: form.custom_price !== '' ? Number(form.custom_price) : null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        status: form.status,
      });

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao matricular aluno.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (enrollment: Enrollment, newStatus: EnrollmentStatus) => {
    const confirmMsg =
      newStatus === 'CANCELLED'
        ? `Deseja realmente cancelar a matrícula de "${enrollment.student_name}"?`
        : `Deseja alterar o status da matrícula para ${newStatus}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/api/enrollments/${enrollment.id}/status`, {
        status: newStatus,
        end_date: newStatus === 'CANCELLED' ? new Date().toISOString().split('T')[0] : undefined,
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar matrícula.';
      alert(msg);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const sName = e.student_name?.toLowerCase() || '';
    const cName = e.class_name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return sName.includes(term) || cName.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Bar e Filtros */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A3654] bg-[#111622] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome do aluno ou turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tech-input block w-full rounded-lg pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tech-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Apenas Ativas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="SUSPENDED">Suspensas</option>
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

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 shadow-glow-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Matrícula</span>
          </button>
        </div>
      </div>

      {/* Tabela de Matrículas */}
      <div className="overflow-hidden rounded-xl border border-[#2A3654] bg-[#111622] shadow-xl">
        {isLoading && filteredEnrollments.length === 0 ? (
          <div className="py-16 text-center text-xs text-red-400">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Carregando matrículas...
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Nenhuma matrícula localizada com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A3654] bg-[#0B0E14] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Aluno</th>
                  <th className="px-4 py-3.5">Turma / Modalidade</th>
                  <th className="px-4 py-3.5">Dia Vencimento</th>
                  <th className="px-4 py-3.5">Preço Ajustado</th>
                  <th className="px-4 py-3.5">Data Início</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3654]/50">
                {filteredEnrollments.map((enr) => {
                  const isActive = enr.status === 'ACTIVE';

                  return (
                    <tr key={enr.id} className="transition-colors hover:bg-[#171F30]/50">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          {enr.student_name || `Aluno #${enr.student_id}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Matrícula ID: <span className="font-mono text-slate-300">#{enr.id}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">
                          {enr.class_name || `Turma #${enr.class_id}`}
                        </div>
                        <div className="text-[11px] text-red-400 font-medium">
                          {enr.martial_art_name || 'Arte Marcial'} &bull; Prof: {enr.professor_name || '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        Dia {enr.due_day} de cada mês
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        {enr.custom_price !== null && enr.custom_price !== undefined ? (
                          <span className="font-bold text-amber-400">
                            {formatCurrency(enr.custom_price)} (Especial)
                          </span>
                        ) : (
                          <span className="text-slate-400">Padrão da Turma</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {enr.start_date}
                      </td>

                      <td className="px-4 py-3.5">
                        {enr.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-400 border border-emerald-500/20 text-[11px]">
                            <CheckCircle className="h-3 w-3" /> Ativa
                          </span>
                        )}
                        {enr.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-400 border border-rose-500/20 text-[11px]">
                            <Ban className="h-3 w-3" /> Cancelada
                          </span>
                        )}
                        {enr.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-400 border border-amber-500/20 text-[11px]">
                            <Clock className="h-3 w-3" /> Suspensa
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {isActive ? (
                          <button
                            onClick={() => handleToggleStatus(enr, 'CANCELLED')}
                            className="rounded border border-[#2A3654] bg-[#0B0E14] px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10"
                            title="Cancelar Matrícula"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(enr, 'ACTIVE')}
                            className="rounded border border-[#2A3654] bg-[#0B0E14] px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                            title="Reativar Matrícula"
                          >
                            Reativar
                          </button>
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

      {/* Modal Nova Matrícula */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-white text-base">Nova Matrícula</h3>
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
                  Selecionar Aluno
                </label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: Number(e.target.value) })}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.phone ? `(${st.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Selecionar Turma
                </label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: Number(e.target.value) })}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.martial_art_name} ({c.week_days} {c.start_time}) - R$ {c.monthly_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Dia de Vencimento
                  </label>
                  <select
                    value={form.due_day}
                    onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-mono"
                  >
                    <option value={5}>Dia 05</option>
                    <option value={10}>Dia 10</option>
                    <option value={15}>Dia 15</option>
                    <option value={20}>Dia 20</option>
                    <option value={25}>Dia 25</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Preço Customizado (Opcional R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Deixe vazio para padrão"
                    value={form.custom_price}
                    onChange={(e) => setForm({ ...form, custom_price: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Data Término (Opcional)
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  />
                </div>
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
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processando...' : 'Efetivar Matrícula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
