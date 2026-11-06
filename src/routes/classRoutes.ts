import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { classService } from '../services/classService.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const createClassSchema = z.object({
  name: z.string().min(2, 'Nome da turma deve ter no mínimo 2 caracteres.'),
  martial_art_id: z.number().int().positive('ID da arte marcial inválido.'),
  professor_id: z.number().int().positive('ID do professor inválido.').optional(),
  age_group: z.enum(['CHILD', 'ADULT', 'MIXED']),
  week_days: z.string().min(2, 'Dias da semana são obrigatórios (ex: Seg, Qua, Sex).'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário de início no formato HH:MM.'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário de término no formato HH:MM.'),
  max_capacity: z.number().int().positive().optional().default(30),
  monthly_fee: z.number().nonnegative('Valor da mensalidade deve ser maior ou igual a zero.'),
  is_active: z.number().int().min(0).max(1).optional().default(1),
});

const updateClassSchema = z.object({
  name: z.string().min(2).optional(),
  martial_art_id: z.number().int().positive().optional(),
  professor_id: z.number().int().positive().optional(),
  age_group: z.enum(['CHILD', 'ADULT', 'MIXED']).optional(),
  week_days: z.string().min(2).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  max_capacity: z.number().int().positive().optional(),
  monthly_fee: z.number().nonnegative().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

export const classRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/classes', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as { martialArtId?: string; activeOnly?: string };
    const filter = {
      martialArtId: query.martialArtId ? parseInt(query.martialArtId, 10) : undefined,
      activeOnly: query.activeOnly === 'true' || query.activeOnly === '1',
    };
    const classes = classService.list(request.currentUser!, filter);
    return reply.send({ success: true, data: classes });
  });

  app.post('/api/classes', { preHandler: [requireAuth] }, async (request, reply) => {
    const parseResult = createClassSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados da turma inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const payload = parseResult.data;
    // Se o usuário for ADMIN e não informou professor_id, exigir
    if (request.currentUser!.role === 'ADMIN' && !payload.professor_id) {
      return reply.status(400).send({ error: 'O campo professor_id é obrigatório para administradores.' });
    }

    try {
      const created = classService.create(
        {
          ...payload,
          professor_id: payload.professor_id ?? (request.currentUser!.professorId || 0),
        },
        request.currentUser!
      );
      return reply.status(201).send({ success: true, data: created });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar turma.';
      return reply.status(400).send({ error: message });
    }
  });

  app.get('/api/classes/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const classId = parseInt(params.id, 10);
    if (isNaN(classId)) {
      return reply.status(400).send({ error: 'ID da turma inválido.' });
    }

    try {
      const classObj = classService.getById(classId, request.currentUser!);
      if (!classObj) {
        return reply.status(404).send({ error: 'Turma não encontrada.' });
      }
      return reply.send({ success: true, data: classObj });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao obter turma.';
      return reply.status(403).send({ error: message });
    }
  });

  app.put('/api/classes/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const classId = parseInt(params.id, 10);
    if (isNaN(classId)) {
      return reply.status(400).send({ error: 'ID da turma inválido.' });
    }

    const parseResult = updateClassSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de atualização inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const updated = classService.update(classId, parseResult.data, request.currentUser!);
      if (!updated) {
        return reply.status(404).send({ error: 'Turma não encontrada.' });
      }
      return reply.send({ success: true, data: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar turma.';
      return reply.status(403).send({ error: message });
    }
  });
};
