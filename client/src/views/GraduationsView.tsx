import React, { useEffect, useState, useCallback } from 'react';
import {
  Award,
  Plus,
  Calendar,
  User,
  Shield,
  ArrowRight,
  RefreshCw,
  X,
  Swords,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Graduation, Student, MartialArt, Professor } from '../types';

export const GraduationsView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [graduations, setGraduations] = useState<Graduation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [martialArts, setMartialArts] = useState<MartialArt[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_id: 0,
    martial_art_id: 0,
    previous_grade: '',
    new_grade: '',
    awarded_at: new Date().toISOString().split('T')[0],
    professor_id: 0,
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [gradsRes, stdRes, artsRes, profsRes] = await Promise.all([
        api.get<Graduation[]>('/api/graduations'),
        api.get<Student[]>('/api/students', { status: 'ACTIVE' }),
        api.get<MartialArt[]>('/api/martial-arts'),
        api.get<Professor[]>('/api/professors'),
      ]);

      setGraduations(gradsRes || []);
      setStudents(stdRes || []);
      setMartialArts(artsRes || []);
      setProfessors(profsRes || []);

      if (stdRes && stdRes.length > 0 && !form.student_id) {
        setForm((prev) => ({ ...prev, student_id: stdRes[0].id }));
      }
      if (artsRes && artsRes.length > 0 && !form.martial_art_id) {
        setForm((prev) => ({ ...prev, martial_art_id: artsRes[0].id }));
      }
      if (profsRes && profsRes.length > 0 && !form.professor_id) {
        setForm((prev) => ({ ...prev, professor_id: profsRes[0].id }));
      }
    } catch (err) {
      console.error('Erro ao listar graduações:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setForm({
      student_id: students[0]?.id || 0,
      martial_art_id: martialArts[0]?.id || 0,
      previous_grade: '',
      new_grade: '',
      awarded_at: new Date().toISOString().split('T')[0],
      professor_id: user?.professor_id || professors[0]?.id || 0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.martial_art_id || !form.new_grade) {
      alert('Preencha os campos obrigatérios do formulário.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/graduations', {
        student_id: Number(form.student_id),
        martial_art_id: Number(form.martial_art_id),
        previous_grade: form.previous_grade,
        new_grade: form.new_grade,
        awarded_at: form.awarded_at,
        professor_id: form.professor_id ? Number(form.professor_id) : undefined,
        notes: form.notes,
      });

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar graduação.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredGraduations = graduations.filter((g) => {
    const sName = g.student_name?.toLowerCase() || '';
    const mName = g.martial_art_name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return sName.includes(term) || mName.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A3654] bg-[#111622] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno ou arte marcial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tech-input block w-full rounded-lg pl-9 pr-3 py-2 text-xs"
          />
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
            className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-400 shadow-glow-purple"
          >
            <Plus className="h-4 w-4" />
            <span>Lançar Nova Graduação</span>
          </button>
        </div>
      </div>

      {/* Linha do Tempo / Tabela de Graduações */}
      <div className="overflow-hidden rounded-xl border border-[#2A3654] bg-[#111622] shadow-xl">
        {isLoading && filteredGraduations.length === 0 ? (
          <div className="py-20 text-center text-xs text-red-400">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Carregando histórico de graduações...
          </div>
        ) : filteredGraduations.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Nenhuma graduação registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A3654] bg-[#0B0E14] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Atleta</th>
                  <th className="px-4 py-3.5">Arte Marcial</th>
                  <th className="px-4 py-3.5">Progressão Técnica</th>
                  <th className="px-4 py-3.5">Data da Conquista</th>
                  <th className="px-4 py-3.5">Mestre / Professor</th>
                  <th className="px-4 py-3.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3654]/50">
                {filteredGraduations.map((g) => (
                  <tr key={g.id} className="transition-colors hover:bg-[#171F30]/50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">
                        {g.student_name || `Aluno #${g.student_id}`}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Registro #{g.id}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-400 border border-purple-500/20">
                        <Swords className="h-3.5 w-3.5" />
                        {g.martial_art_name || 'Modalidade'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {g.previous_grade ? (
                          <span className="rounded bg-[#171F30] px-2 py-0.5 text-xs font-semibold text-slate-300 border border-[#2A3654]">
                            {g.previous_grade}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Iniciante</span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-red-400" />
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/30">
                          {g.new_grade}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {formatDate(g.awarded_at)}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      {g.professor_name || '-'}
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                      {g.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Graduação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Registrar Graduação Técnica</h3>
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
                  Atleta a Graduar
                </label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: Number(e.target.value) })}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Modalidade Marcial
                  </label>
                  <select
                    value={form.martial_art_id}
                    onChange={(e) => setForm({ ...form, martial_art_id: Number(e.target.value) })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  >
                    {martialArts.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Professor Outorgante
                  </label>
                  <select
                    value={form.professor_id}
                    onChange={(e) => setForm({ ...form, professor_id: Number(e.target.value) })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  >
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Graduação Anterior (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.previous_grade}
                    onChange={(e) => setForm({ ...form, previous_grade: e.target.value })}
                    placeholder="Ex: Faixa Branca ou Grau 1"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Nova Graduação Conquistada
                  </label>
                  <input
                    type="text"
                    value={form.new_grade}
                    onChange={(e) => setForm({ ...form, new_grade: e.target.value })}
                    placeholder="Ex: Faixa Azul / Prajied Vermelho"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-bold text-red-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Data do Exame / Cerimônia
                </label>
                <input
                  type="date"
                  value={form.awarded_at}
                  onChange={(e) => setForm({ ...form, awarded_at: e.target.value })}
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Observações / Mérito Técnico
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Aprovado com louvor no exame de graduação semestral"
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
                  className="flex-1 rounded-lg bg-purple-500 py-2.5 font-bold text-white hover:bg-purple-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registrando...' : 'Efetivar Graduação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
