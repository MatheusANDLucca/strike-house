import { studentRepository } from '../database/repositories/index.js';
import type {
  AuthContext,
  Student,
  StudentWithGuardians,
  Guardian,
  CreateStudentDTO,
  UpdateStudentDTO,
  CreateGuardianDTO,
} from '../types/index.js';

export class StudentService {
  list(currentUser: AuthContext, search?: string, status?: string): Student[] {
    if (currentUser.role === 'PROFESSOR') {
      const professorId = currentUser.professorId ?? -1;
      return studentRepository.listByProfessor(professorId, { search, status });
    }
    return studentRepository.list({ search, status });
  }

  getById(id: number, currentUser: AuthContext): StudentWithGuardians | null {
    const student = studentRepository.findById(id);
    if (!student) {
      return null;
    }

    if (currentUser.role === 'PROFESSOR') {
      const professorId = currentUser.professorId ?? -1;
      const isEnrolled = studentRepository.isStudentEnrolledWithProfessor(id, professorId);
      if (!isEnrolled) {
        throw new Error('Acesso negado. O aluno não está matriculado em nenhuma de suas turmas.');
      }
    }

    return student;
  }

  create(data: CreateStudentDTO): Student {
    return studentRepository.create(data);
  }

  update(id: number, data: UpdateStudentDTO, currentUser: AuthContext): Student | null {
    const existing = studentRepository.findById(id);
    if (!existing) {
      return null;
    }

    if (currentUser.role === 'PROFESSOR') {
      const professorId = currentUser.professorId ?? -1;
      const isEnrolled = studentRepository.isStudentEnrolledWithProfessor(id, professorId);
      if (!isEnrolled) {
        throw new Error('Acesso negado. O aluno não está matriculado em nenhuma de suas turmas.');
      }
    }

    return studentRepository.update(id, data);
  }

  linkGuardian(studentId: number, data: CreateGuardianDTO, currentUser: AuthContext): Guardian {
    const existing = studentRepository.findById(studentId);
    if (!existing) {
      throw new Error('Aluno não encontrado.');
    }

    if (currentUser.role === 'PROFESSOR') {
      const professorId = currentUser.professorId ?? -1;
      const isEnrolled = studentRepository.isStudentEnrolledWithProfessor(studentId, professorId);
      if (!isEnrolled) {
        throw new Error('Acesso negado. O aluno não está matriculado em nenhuma de suas turmas.');
      }
    }

    return studentRepository.linkGuardian(studentId, data);
  }
}

export const studentService = new StudentService();
