import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/authService.js';
import type { AuthContext, UserRole } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: AuthContext;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if ((request.query as Record<string, string | undefined>)?.token) {
    token = (request.query as Record<string, string | undefined>).token;
  }

  if (!token) {
    reply.status(401).send({ error: 'Não autenticado. Token não informado.' });
    return;
  }

  const context = authService.validateSession(token);
  if (!context) {
    reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  request.currentUser = context;
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.currentUser) {
      await requireAuth(request, reply);
      if (reply.sent) return;
    }

    const user = request.currentUser;
    if (!user) {
      reply.status(401).send({ error: 'Não autenticado.' });
      return;
    }

    // Regra RBAC: ADMIN sempre possui acesso a todas as rotas
    if (user.role === 'ADMIN') {
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      reply.status(403).send({ error: 'Acesso negado. Recurso restrito a administradores.' });
      return;
    }
  };
}
