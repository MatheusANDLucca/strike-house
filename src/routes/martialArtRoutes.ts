import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { martialArtRepository } from '../database/repositories/index.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const createMartialArtSchema = z.object({
  name: z.string().min(2, 'Nome da modalidade é obrigatório.'),
  description: z.string().optional().default(''),
  is_active: z.number().int().min(0).max(1).optional().default(1),
});

export const martialArtRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/martial-arts', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as { activeOnly?: string };
    const activeOnly = query.activeOnly === 'true' || query.activeOnly === '1';
    const arts = martialArtRepository.list(activeOnly);
    return reply.send({ success: true, data: arts });
  });

  app.post('/api/martial-arts', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const parseResult = createMartialArtSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados da arte marcial inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const art = martialArtRepository.create(parseResult.data);
      return reply.status(201).send({ success: true, data: art });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar modalidade.';
      return reply.status(400).send({ error: message });
    }
  });
};
