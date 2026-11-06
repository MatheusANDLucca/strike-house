import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { expenseRepository } from '../database/repositories/index.js';
import { requireRole } from '../middlewares/authMiddleware.js';

const createExpenseSchema = z.object({
  description: z.string().min(2, 'Descrição é obrigatória.'),
  category: z.string().min(2, 'Categoria é obrigatória (ex: Equipamentos, Aluguel, Limpeza).'),
  amount: z.number().positive('Valor da despesa deve ser maior que zero.'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data da despesa no formato AAAA-MM-DD.'),
  notes: z.string().optional().default(''),
});

export const expenseRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/expenses', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const query = request.query as { category?: string; startDate?: string; endDate?: string };
    const expenses = expenseRepository.list(query);
    return reply.send({ success: true, data: expenses });
  });

  app.post('/api/expenses', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const parseResult = createExpenseSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados da despesa inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const expense = expenseRepository.create({
        ...parseResult.data,
        created_by_user_id: request.currentUser!.id,
      });
      return reply.status(201).send({ success: true, data: expense });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar despesa.';
      return reply.status(400).send({ error: message });
    }
  });
};
