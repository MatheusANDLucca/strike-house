import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarRange,
  Plus,
  Clock,
  Users,
  DollarSign,
  Edit2,
  RefreshCw,
  X,
  Swords,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ClassItem, MartialArt, Professor, AgeGroup } from '../types';

export const ClassesView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [martialArts, setMartialArts] = useState<MartialArt[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtFilter, setSelectedArtFilter] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    martial_art_id: 1,
    professor_id: 1,
    age_group: 'ADULT' as AgeGroup,
    week_days: 'Seg, Qua, Sex',
    start_time: '19:00',
    end_time: '20:30',
    max_capacity: 30,
    monthly_fee: 150,
    is_active: 1,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [classesRes, artsRes, profsRes] = await Promise.all([
        api.get<ClassItem[]>('/api/classes', {
          martialArtId: selectedArtFilter || undefined,
        }),
        api.get<MartialArt[]>('/api/martial-arts'),
        api.get<Professor[]>('/api/professors'),
      ]);

      setClasses(classesRes || []);
      setMartialArts(artsRes || []);
      setProfessors(profsRes || []);
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArtFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      martial_art_id: martialArts[0]?.id || 1,
      professor_id: professors[0]?.id || 1,
      age_group: 'ADULT',
      week_days: 'Seg, Qua, Sex',
      start_time: '19:00',
      end_time: '20:30',
      max_capacity: 30,
      monthly_fee: 150,
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      martial_art_id: c.martial_art_id,
      professor_id: c.professor_id,
      age_group: c.age_group,
      week_days: c.week_days,
      start_time: c.start_time,
      end_time: c.end_time,
      max_capacity: c.max_capacity,
      monthly_fee: c.monthly_fee,
      is_active: c.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        martial_art_id: Number(formData.martial_art_id),
        professor_id: Number(formData.professor_id),
        max_capacity: Number(formData.max_capacity),
        monthly_fee: Number(formData.monthly_fee),
        is_active: Number(formData.is_active),
      };

      if (editingClass) {
        await api.put(`/api/classes/${editingClass.id}`, payload);
      } else {
        await api.post('/api/classes', payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar turma.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Top Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A3654] bg-[#111622] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Filtrar Arte:
          </label>
          <select
            value={selectedArtFilter}
            onChange={(e) => setSelectedArtFilter(e.target.value)}
            className="tech-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="">Todas as Modalidades</option>
            {martialArts.map((art) => (
              <option key={art.id} value={art.id}>
                {art.name}
              </option>
            ))}
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
            <span>Criar Nova Turma</span>
          </button>
        </div>
      </div>

      {/* Grid de Turmas */}
      {isLoading && classes.length === 0 ? (
        <div className="py-20 text-center text-xs text-red-400">
          <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
          Carregando grade de treinos...
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-[#2A3654] bg-[#111622] py-16 text-center text-xs text-slate-400">
          Nenhuma turma encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const enrolled = c.enrolled_count || 0;
            const max = c.max_capacity || 30;
            const percentage = Math.min(100, Math.round((enrolled / max) * 100));

            return (
              <div
                key={c.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#2A3654] bg-[#111622] p-5 transition-all hover:border-red-500/50 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <Swords className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                          {c.martial_art_name || 'Arte Marcial'}
                        </span>
                        <h3 className="text-base font-extrabold text-white">{c.name}</h3>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="rounded border border-[#2A3654] bg-[#0B0E14] p-1.5 text-slate-400 opacity-80 hover:border-red-500/50 hover:text-white group-hover:opacity-100"
                      title="Editar Turma"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-[#2A3654]/60 pt-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Instrutor Responsável:</span>
                      <span className="font-semibold text-white">
                        {c.professor_name || 'Docente Indefinido'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dias da Semana:</span>
                      <span className="font-mono text-slate-200">{c.week_days}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Horário:</span>
                      <div className="flex items-center gap-1 font-mono text-red-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {c.start_time} às {c.end_time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Faixa Etária:</span>
                      <span className="rounded bg-[#171F30] px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-[#2A3654]">
                        {c.age_group === 'CHILD' ? 'Infantil' : c.age_group === 'ADULT' ? 'Adulto' : 'Misto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé com Ocupação e Valor */}
                <div className="mt-5 border-t border-[#2A3654]/60 pt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>Alunos Matriculados:</span>
                    </div>
                    <span className="font-semibold text-slate-200">
                      {enrolled} / {max}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#0B0E14] overflow-hidden border border-[#2A3654]/40">
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

                  <div className="mt-3 flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-medium">Mensalidade Padrão:</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {formatCurrency(c.monthly_fee)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Turma */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-white text-base">
                  {editingClass ? 'Editar Dados da Turma' : 'Cadastrar Nova Turma'}
                </h3>
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
                  Nome da Turma
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Muay Thai Noturno Avançado"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Modalidade / Arte
                  </label>
                  <select
                    value={formData.martial_art_id}
                    onChange={(e) => setFormData({ ...formData, martial_art_id: Number(e.target.value) })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  >
                    {martialArts.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Professor Responsável
                  </label>
                  <select
                    value={formData.professor_id}
                    onChange={(e) => setFormData({ ...formData, professor_id: Number(e.target.value) })}
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

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Faixa Etária
                  </label>
                  <select
                    value={formData.age_group}
                    onChange={(e) => setFormData({ ...formData, age_group: e.target.value as AgeGroup })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ADULT">Adulto</option>
                    <option value="CHILD">Infantil</option>
                    <option value="MIXED">Misto</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Dias da Semana
                  </label>
                  <input
                    type="text"
                    value={formData.week_days}
                    onChange={(e) => setFormData({ ...formData, week_days: e.target.value })}
                    placeholder="Ex: Seg, Qua, Sex"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Horário Início (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Horário Término (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Capacidade Máxima (Alunos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Mensalidade Padrão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs font-semibold text-emerald-400"
                    required
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
                  {isSubmitting ? 'Salvando...' : 'Salvar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
