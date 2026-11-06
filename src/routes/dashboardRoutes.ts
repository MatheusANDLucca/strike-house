import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { studentService } from '../services/studentService.js';
import { classService } from '../services/classService.js';
import { billingService } from '../services/billingService.js';
import { enrollmentRepository } from '../database/repositories/index.js';

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/dashboard', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = request.currentUser!;

    const students = studentService.list(user);
    const activeClasses = classService.list(user, { activeOnly: true });
    const financialSummary = billingService.getSummary(user);

    // Contagem de matrículas
    let totalActiveEnrollments = 0;
    if (user.role === 'ADMIN') {
      totalActiveEnrollments = enrollmentRepository.listActive().length;
    } else {
      totalActiveEnrollments = activeClasses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0);
    }

    // Últimas mensalidades pendentes/vencidas (Top 5)
    const overdueBills = billingService.listBills(user, { status: 'OVERDUE' }).slice(0, 5);
    const pendingBills = billingService.listBills(user, { status: 'PENDING' }).slice(0, 5);

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          professorId: user.professorId,
        },
        metrics: {
          totalStudents: students.length,
          activeClassesCount: activeClasses.length,
          activeEnrollmentsCount: totalActiveEnrollments,
          financialSummary,
        },
        classes: activeClasses,
        recentOverdueBills: overdueBills,
        recentPendingBills: pendingBills,
      },
    });
  });
};
