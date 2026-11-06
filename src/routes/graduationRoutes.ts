import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { graduationRepository, studentRepository } from '../database/repositories/index.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const createGraduationSchema = z.object({
  student_id: z.number().int().positive('ID do aluno inválido.'),
  martial_art_id: z.number().int().positive('ID da arte marcial inválido.'),
  previous_grade: z.string().optional().default(''),
  new_grade: z.string().min(1, 'Nova graduação/faixa é obrigatória.'),
  awarded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de graduação no formato AAAA-MM-DD.'),
  professor_id: z.number().int().positive().optional(),
  notes: z.string().optional().default(''),
});

export const graduationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/graduations', { preHandler: [requireAuth] }, async (request, reply) => {
    const currentUser = request.currentUser!;
    const profId = currentUser.role === 'PROFESSOR' ? currentUser.professorId ?? undefined : undefined;
    const graduations = graduationRepository.listAll(profId);
    return reply.send({ success: true, data: graduations });
  });

  app.get('/api/graduations/student/:studentId', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { studentId: string };
    const studentId = parseInt(params.studentId, 10);
    if (isNaN(studentId)) {
      return reply.status(400).send({ error: 'ID do aluno inválido.' });
    }

    const currentUser = request.currentUser!;
    if (currentUser.role === 'PROFESSOR') {
      const isEnrolled = studentRepository.isStudentEnrolledWithProfessor(studentId, currentUser.professorId!);
      if (!isEnrolled) {
        return reply.status(403).send({
          success: false,
          error: 'Acesso negado. O aluno não está matriculado em turmas sob sua responsabilidade.',
        });
      }
    }

    const graduations = graduationRepository.listByStudent(studentId);
    return reply.send({ success: true, data: graduations });
  });

  app.post('/api/graduations', { preHandler: [requireAuth] }, async (request, reply) => {
    const parseResult = createGraduationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de graduação inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const payload = parseResult.data;
    const currentUser = request.currentUser!;
    let resolvedProfessorId = payload.professor_id;

    if (currentUser.role === 'PROFESSOR') {
      if (!currentUser.professorId) {
        return reply.status(403).send({ error: 'Perfil docente não vinculado a professor.' });
      }
      const isEnrolled = studentRepository.isStudentEnrolledWithProfessor(payload.student_id, currentUser.professorId);
      if (!isEnrolled) {
        return reply.status(403).send({
          success: false,
          error: 'Acesso negado. Você só pode graduar alunos matriculados em suas próprias turmas.',
        });
      }
      payload.professor_id = currentUser.professorId;
      resolvedProfessorId = currentUser.professorId;
    } else if (!resolvedProfessorId) {
      return reply.status(400).send({ error: 'O campo professor_id é obrigatório.' });
    }

    try {
      const graduation = graduationRepository.create({
        ...payload,
        professor_id: resolvedProfessorId,
      });
      return reply.status(201).send({ success: true, data: graduation });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar graduação.';
      return reply.status(400).send({ error: message });
    }
  });
};
