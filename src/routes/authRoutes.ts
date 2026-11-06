import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/auth/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de login inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const { email, password } = parseResult.data;
      const result = authService.login(email, password);
      return reply.send({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao realizar login.';
      return reply.status(401).send({ error: message });
    }
  });

  app.get('/api/auth/me', { preHandler: [requireAuth] }, async (request, reply) => {
    return reply.send({
      success: true,
      data: request.currentUser,
    });
  });

  app.post('/api/auth/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if ((request.query as Record<string, string | undefined>)?.token) {
      token = (request.query as Record<string, string | undefined>).token;
    }

    if (token) {
      authService.logout(token);
    }

    return reply.send({
      success: true,
      message: 'Sessão encerrada com sucesso.',
    });
  });
};
