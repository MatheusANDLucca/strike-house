import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { studentService } from '../services/studentService.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const createStudentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve seguir o formato AAAA-MM-DD.'),
  phone: z.string().optional().default(''),
  email: z.string().email('Email inválido.').optional().or(z.literal('')).default(''),
  address: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  notes: z.string().optional().default(''),
});

const updateStudentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve seguir o formato AAAA-MM-DD.').optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

const createGuardianSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  phone: z.string().min(8, 'Telefone de contato é obrigatório.'),
  email: z.string().email('Email inválido.').optional().or(z.literal('')).default(''),
  relationship: z.string().optional().default('Responsável'),
  notes: z.string().optional().default(''),
});

export const studentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/students', { preHandler: [requireAuth] }, async (request, reply) => {
    const query = request.query as { search?: string; status?: string };
    const students = studentService.list(request.currentUser!, query.search, query.status);
    return reply.send({ success: true, data: students });
  });

  app.post('/api/students', { preHandler: [requireAuth] }, async (request, reply) => {
    const parseResult = createStudentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de aluno inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const student = studentService.create(parseResult.data);
      return reply.status(201).send({ success: true, data: student });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar aluno.';
      return reply.status(400).send({ error: message });
    }
  });

  app.get('/api/students/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const studentId = parseInt(params.id, 10);
    if (isNaN(studentId)) {
      return reply.status(400).send({ error: 'ID do aluno inválido.' });
    }

    try {
      const student = studentService.getById(studentId, request.currentUser!);
      if (!student) {
        return reply.status(404).send({ error: 'Aluno não encontrado.' });
      }
      return reply.send({ success: true, data: student });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar aluno.';
      return reply.status(403).send({ error: message });
    }
  });

  app.put('/api/students/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const studentId = parseInt(params.id, 10);
    if (isNaN(studentId)) {
      return reply.status(400).send({ error: 'ID do aluno inválido.' });
    }

    const parseResult = updateStudentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados de atualização inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const updated = studentService.update(studentId, parseResult.data, request.currentUser!);
      if (!updated) {
        return reply.status(404).send({ error: 'Aluno não encontrado.' });
      }
      return reply.send({ success: true, data: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar aluno.';
      return reply.status(403).send({ error: message });
    }
  });

  app.post('/api/students/:id/guardians', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const studentId = parseInt(params.id, 10);
    if (isNaN(studentId)) {
      return reply.status(400).send({ error: 'ID do aluno inválido.' });
    }

    const parseResult = createGuardianSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados do responsável inválidos.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const guardian = studentService.linkGuardian(studentId, parseResult.data, request.currentUser!);
      return reply.status(201).send({ success: true, data: guardian });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao vincular responsável.';
      if (message.includes('Acesso negado')) {
        return reply.status(403).send({ error: message });
      }
      return reply.status(400).send({ error: message });
    }
  });
};
