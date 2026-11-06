import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { enrollmentRepository, classRepository } from '../database/repositories/index.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import type { EnrollmentStatus } from '../types/index.js';

const createEnrollmentSchema = z.object({
  student_id: z.number().int().positive('ID do aluno inválido.'),
  class_id: z.number().int().positive('ID da turma inválido.'),
  due_day: z.number().int().min(1).max(31).optional().default(10),
  custom_price: z.number().nonnegative('Preço customizado não pode ser negativo.').nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início no formato AAAA-MM-DD.'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'SUSPENDED']).optional().default('ACTIVE'),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'CANCELLED', 'SUSPENDED']),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const enrollmentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/enrollments', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as { studentId?: string; classId?: string; status?: EnrollmentStatus };
    const filters = {
      studentId: query.studentId ? parseInt(query.studentId, 10) : undefined,
      classId: query.classId ? parseInt(query.classId, 10) : undefined,
      status: query.status,
    };

    let enrollments = enrollmentRepository.list(filters);

    // Se o usuário for PROFESSOR, filtra para exibir apenas matrículas de suas turmas
    if (request.currentUser!.role === 'PROFESSOR') {
      const professorId = request.currentUser!.professorId ?? undefined;
      const professorClasses = classRepository.list({ professorId });
      const allowedClassIds = new Set(professorClasses.map((c) => c.id));
      enrollments = enrollments.filter((e) => allowedClassIds.has(e.class_id));
    }


    return reply.send({ success: true, data: enrollments });
  });

  app.post('/api/enrollments', { preHandler: [requireAuth] }, async (request, reply) => {
    const parseResult = createEnrollmentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados da matrícula inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const payload = parseResult.data;

    // Se for professor, validar que a turma pertence a ele
    if (request.currentUser!.role === 'PROFESSOR') {
      const classObj = classRepository.findById(payload.class_id);
      if (!classObj || classObj.professor_id !== request.currentUser!.professorId) {
        return reply.status(403).send({ error: 'Acesso negado. Você só pode matricular alunos em suas turmas.' });
      }
    }

    try {
      const created = enrollmentRepository.create(payload);
      return reply.status(201).send({ success: true, data: created });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar matrícula.';
      return reply.status(400).send({ error: message });
    }
  });

  app.put('/api/enrollments/:id/status', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const enrollmentId = parseInt(params.id, 10);
    if (isNaN(enrollmentId)) {
      return reply.status(400).send({ error: 'ID da matrícula inválido.' });
    }

    const parseResult = updateStatusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de status inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const existing = enrollmentRepository.findById(enrollmentId);
    if (!existing) {
      return reply.status(404).send({ error: 'Matrícula não encontrada.' });
    }

    if (request.currentUser!.role === 'PROFESSOR') {
      const classObj = classRepository.findById(existing.class_id);
      if (!classObj || classObj.professor_id !== request.currentUser!.professorId) {
        return reply.status(403).send({ error: 'Acesso negado. Matrícula pertence a outra turma.' });
      }
    }

    try {
      const updated = enrollmentRepository.updateStatus(
        enrollmentId,
        parseResult.data.status,
        parseResult.data.end_date
      );
      return reply.send({ success: true, data: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status da matrícula.';
      return reply.status(400).send({ error: message });
    }
  });
};
