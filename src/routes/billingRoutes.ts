import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { billingService } from '../services/billingService.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import type { MonthlyBillStatus, PaymentMethod } from '../types/index.js';

const generateBillsSchema = z.object({
  competence: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de competência deve ser AAAA-MM (ex: 2026-11).'),
});

const payBillSchema = z.object({
  amount: z.number().positive('Valor pago deve ser maior que zero.'),
  method: z.enum(['MONEY', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD']),
  notes: z.string().optional().default(''),
  reference_code: z.string().optional().default(''),
});

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/billing/bills', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as {
      status?: MonthlyBillStatus;
      competence?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      classId?: string;
      studentId?: string;
    };

    const filters = {
      status: query.status,
      competence: query.competence,
      dueDateFrom: query.dueDateFrom,
      dueDateTo: query.dueDateTo,
      classId: query.classId ? parseInt(query.classId, 10) : undefined,
      studentId: query.studentId ? parseInt(query.studentId, 10) : undefined,
    };

    const bills = billingService.listBills(request.currentUser!, filters);
    return reply.send({ success: true, data: bills });
  });

  app.post('/api/billing/generate', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const parseResult = generateBillsSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Competência inválida.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const result = billingService.generateMonthlyBills(parseResult.data.competence);
      return reply.send({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar mensalidades.';
      return reply.status(400).send({ error: message });
    }
  });

  app.post('/api/billing/bills/:id/pay', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const billId = parseInt(params.id, 10);
    if (isNaN(billId)) {
      return reply.status(400).send({ error: 'ID da mensalidade inválido.' });
    }

    const parseResult = payBillSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de pagamento inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      // Verifica permissão do professor
      const bill = billingService.getBillById(billId, request.currentUser!);
      if (!bill) {
        return reply.status(404).send({ success: false, error: 'Mensalidade não encontrada.' });
      }

      const payment = billingService.recordPayment(
        billId,
        parseResult.data.amount,
        parseResult.data.method as PaymentMethod,
        request.currentUser!.id,
        parseResult.data.notes,
        parseResult.data.reference_code
      );

      return reply.status(201).send({ success: true, data: payment });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar pagamento.';
      if (message.includes('Acesso negado')) {
        return reply.status(403).send({ success: false, error: message });
      }
      return reply.status(400).send({ error: message });
    }
  });

  app.get('/api/billing/summary', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as { periodStart?: string; periodEnd?: string };
    const summary = billingService.getSummary(request.currentUser!, query.periodStart, query.periodEnd);
    return reply.send({ success: true, data: summary });
  });
};
