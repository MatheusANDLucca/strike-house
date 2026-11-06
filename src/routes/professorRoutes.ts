import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { professorRepository } from '../database/repositories/index.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import type { ProfessorStatus } from '../types/index.js';

const createProfessorSchema = z.object({
  name: z.string().min(2, 'Nome do professor é obrigatório.'),
  phone: z.string().optional().default(''),
  email: z.string().email('Email inválido.').optional().or(z.literal('')).default(''),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  user_id: z.number().int().positive().nullable().optional(),
});

export const professorRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/professors', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as { status?: ProfessorStatus };
    const professors = professorRepository.list(query.status);
    return reply.send({ success: true, data: professors });
  });

  app.post('/api/professors', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const parseResult = createProfessorSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados do professor inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const professor = professorRepository.create(parseResult.data);
      return reply.status(201).send({ success: true, data: professor });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar professor.';
      return reply.status(400).send({ error: message });
    }
  });
};
