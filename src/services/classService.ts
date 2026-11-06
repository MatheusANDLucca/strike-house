import { classRepository, professorRepository } from '../database/repositories/index.js';
import type {
  AuthContext,
  ClassWithDetails,
  ClassEntity,
  CreateClassDTO,
  UpdateClassDTO,
} from '../types/index.js';

export class ClassService {
  list(currentUser: AuthContext, filter?: { martialArtId?: number; activeOnly?: boolean }): ClassWithDetails[] {
    const listFilter = {
      ...filter,
      professorId: currentUser.role === 'PROFESSOR' ? (currentUser.professorId ?? -1) : undefined,
    };
    return classRepository.list(listFilter);
  }

  getById(id: number, currentUser: AuthContext): ClassWithDetails | null {
    const classObj = classRepository.findById(id);
    if (!classObj) {
      return null;
    }

    if (currentUser.role === 'PROFESSOR' && classObj.professor_id !== currentUser.professorId) {
      throw new Error('Acesso negado. Esta turma não pertence ao seu perfil docente.');
    }

    return classObj;
  }

  create(data: CreateClassDTO, currentUser: AuthContext): ClassEntity {
    const dto = { ...data };

    if (currentUser.role === 'PROFESSOR') {
      if (!currentUser.professorId) {
        throw new Error('Usuário autenticado como professor não possui vínculo com registro docente.');
      }
      dto.professor_id = currentUser.professorId;
    } else {
      // ADMIN: validar se o professorId informado existe
      const prof = professorRepository.findById(dto.professor_id);
      if (!prof) {
        throw new Error('Professor informado não foi encontrado.');
      }
    }

    return classRepository.create(dto);
  }

  update(id: number, data: UpdateClassDTO, currentUser: AuthContext): ClassEntity | null {
    const existing = classRepository.findById(id);
    if (!existing) {
      return null;
    }

    if (currentUser.role === 'PROFESSOR') {
      if (existing.professor_id !== currentUser.professorId) {
        throw new Error('Acesso negado. Você só pode gerenciar suas próprias turmas.');
      }
      // Professor não pode transferir a turma para outro professor
      if (data.professor_id !== undefined && data.professor_id !== currentUser.professorId) {
        throw new Error('Professores não possuem permissão para transferir turmas.');
      }
    }

    return classRepository.update(id, data);
  }
}

export const classService = new ClassService();
