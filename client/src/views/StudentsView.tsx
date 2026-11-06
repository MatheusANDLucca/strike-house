import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import type { Student, StudentStatus, Guardian } from '../types';

export const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Modais
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [selectedStudentForGuardian, setSelectedStudentForGuardian] = useState<Student | null>(null);

  // Form de Aluno
  const [studentForm, setStudentForm] = useState({
    name: '',
    birth_date: '',
    phone: '',
    email: '',
    address: '',
    status: 'ACTIVE' as StudentStatus,
    notes: '',
  });

  // Form de Responsável
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'Mãe/Pai',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Student[]>('/api/students', {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });
      setStudents(res || []);
    } catch (err) {
      console.error('Erro ao listar alunos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleOpenCreateStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      name: '',
      birth_date: '',
      phone: '',
      email: '',
      address: '',
      status: 'ACTIVE',
      notes: '',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStudentForm({
      name: st.name,
      birth_date: st.birth_date,
      phone: st.phone || '',
      email: st.email || '',
      address: st.address || '',
      status: st.status,
      notes: st.notes || '',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenAddGuardian = (st: Student) => {
    setSelectedStudentForGuardian(st);
    setGuardianForm({
      name: '',
      phone: '',
      email: '',
      relationship: 'Mãe/Pai',
      notes: '',
    });
    setIsGuardianModalOpen(true);
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, studentForm);
      } else {
        await api.post('/api/students', studentForm);
      }
      setIsStudentModalOpen(false);
      loadStudents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar aluno.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForGuardian) return;
    try {
      setIsSubmitting(true);
      await api.post(`/api/students/${selectedStudentForGuardian.id}/guardians`, guardianForm);
      setIsGuardianModalOpen(false);
      loadStudents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao vincular responsável.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A3654] bg-[#111622] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tech-input block w-full rounded-lg pl-9 pr-3 py-2 text-xs"
            />
          </div>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tech-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="INACTIVE">Apenas Inativos</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStudents}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A3654] bg-[#0B0E14] text-slate-300 hover:text-white"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateStudent}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 shadow-glow-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Aluno</span>
          </button>
        </div>
      </div>

      {/* Lista / Tabela de Alunos */}
      <div className="overflow-hidden rounded-xl border border-[#2A3654] bg-[#111622] shadow-xl">
        {isLoading && students.length === 0 ? (
          <div className="py-16 text-center text-xs text-red-400">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Carregando relação de atletas...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Nenhum aluno encontrado para os critérios pesquisados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A3654] bg-[#0B0E14] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Atleta</th>
                  <th className="px-4 py-3.5">Faixa Etária</th>
                  <th className="px-4 py-3.5">Contato</th>
                  <th className="px-4 py-3.5">Responsáveis Legais</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3654]/50">
                {students.map((st) => {
                  const age = calculateAge(st.birth_date);
                  const isMinor = age < 18;
                  const isActive = st.status === 'ACTIVE';

                  return (
                    <tr key={st.id} className="transition-colors hover:bg-[#171F30]/50">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{st.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>Nasc: {st.birth_date} ({age} anos)</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {isMinor ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-400 border border-amber-500/20 text-[11px]">
                            Infantil ({age}a)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 font-semibold text-red-400 border border-red-500/20 text-[11px]">
                            Adulto ({age}a)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{st.phone || 'Sem telefone'}</span>
                        </div>
                        {st.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="h-3 w-3 text-slate-500" />
                            <span>{st.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {st.guardians && st.guardians.length > 0 ? (
                          <div className="space-y-1">
                            {st.guardians.map((g) => (
                              <div key={g.id} className="text-[11px] text-slate-300">
                                <span className="font-semibold text-white">{g.name}</span>{' '}
                                <span className="text-slate-500">({g.relationship}):</span>{' '}
                                <span className="font-mono text-red-400">{g.phone}</span>
                              </div>
                            ))}
                          </div>
                        ) : isMinor ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                            <ShieldAlert className="h-3.5 w-3.5" /> Pendente responsável
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Próprio atleta</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-400 border border-emerald-500/20 text-[11px]">
                            <CheckCircle className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-400 border border-rose-500/20 text-[11px]">
                            <XCircle className="h-3 w-3" /> Inativo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenAddGuardian(st)}
                          className="rounded border border-[#2A3654] bg-[#0B0E14] p-1.5 text-slate-300 hover:border-amber-500/50 hover:text-amber-400"
                          title="Vincular Responsável Legal"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditStudent(st)}
                          className="rounded border border-[#2A3654] bg-[#0B0E14] p-1.5 text-slate-300 hover:border-red-500/50 hover:text-red-400"
                          title="Editar Cadastro"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastrar / Editar Aluno */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-white text-base">
                  {editingStudent ? 'Editar Cadastro de Aluno' : 'Novo Aluno'}
                </h3>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#171F30] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={studentForm.birth_date}
                    onChange={(e) => setStudentForm({ ...studentForm, birth_date: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="aluno@email.com"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as StudentStatus })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Endereço Residencial
                </label>
                <input
                  type="text"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Observações Médicas / Restrições
                </label>
                <textarea
                  rows={2}
                  value={studentForm.notes}
                  onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                  placeholder="Ex: Asma leve, alergias, contato de emergência..."
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2.5 font-semibold text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Responsável Legal */}
      {isGuardianModalOpen && selectedStudentForGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3654] bg-[#111622] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3654]">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Vincular Responsável</h3>
              </div>
              <button
                onClick={() => setIsGuardianModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#171F30] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-[#2A3654] bg-[#0B0E14] p-2.5 text-xs text-slate-300">
              Aluno: <span className="font-bold text-white">{selectedStudentForGuardian.name}</span>
            </div>

            <form onSubmit={handleSubmitGuardian} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  value={guardianForm.name}
                  onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
                  placeholder="Ex: Maria Aparecida Silva"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={guardianForm.phone}
                    onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                    placeholder="(11) 99999-8888"
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Parentesco
                  </label>
                  <select
                    value={guardianForm.relationship}
                    onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })}
                    className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Mãe/Pai">Mãe / Pai</option>
                    <option value="Avô/Avó">Avô / Avó</option>
                    <option value="Tio/Tia">Tio / Tia</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={guardianForm.email}
                  onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
                  placeholder="responsavel@email.com"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={guardianForm.notes}
                  onChange={(e) => setGuardianForm({ ...guardianForm, notes: e.target.value })}
                  placeholder="Ex: Autorizado a retirar após o treino"
                  className="tech-input block w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGuardianModalOpen(false)}
                  className="flex-1 rounded-lg border border-[#2A3654] bg-[#0B0E14] py-2.5 font-semibold text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-amber-500 py-2.5 font-bold text-black hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Vincular Responsável'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
