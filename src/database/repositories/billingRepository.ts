import { getDatabase } from '../connection.js';
import type {
  MonthlyBill,
  MonthlyBillWithDetails,
  Payment,
  CreateMonthlyBillDTO,
  CreatePaymentDTO,
  BillingFilterOptions,
  FinancialSummary,
} from '../../types/index.js';

export class BillingRepository {
  findById(id: number): MonthlyBillWithDetails | null {
    const db = getDatabase();
    const sql = `
      SELECT
        b.*,
        e.student_id,
        s.name AS student_name,
        e.class_id,
        c.name AS class_name,
        c.professor_id,
        p.name AS professor_name,
        pay.amount_paid,
        pay.payment_date,
        pay.payment_method
      FROM monthly_bills b
      JOIN enrollments e ON e.id = b.enrollment_id
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      JOIN professors p ON p.id = c.professor_id
      LEFT JOIN payments pay ON pay.monthly_bill_id = b.id
      WHERE b.id = ?
    `;
    const row = db.prepare(sql).get(id) as unknown as MonthlyBillWithDetails | undefined;
    return row ?? null;
  }

  findActiveBillByEnrollmentAndCompetence(enrollmentId: number, competence: string): MonthlyBill | null {
    const db = getDatabase();
    const sql = `
      SELECT * FROM monthly_bills
      WHERE enrollment_id = ? AND competence = ? AND status != 'CANCELLED'
    `;
    const row = db.prepare(sql).get(enrollmentId, competence) as unknown as MonthlyBill | undefined;
    return row ?? null;
  }

  // Alias para retrocompatibilidade
  findPendingByEnrollmentAndMonth(enrollmentId: number, competence: string): MonthlyBill | null {
    return this.findActiveBillByEnrollmentAndCompetence(enrollmentId, competence);
  }

  list(filters?: BillingFilterOptions): MonthlyBillWithDetails[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status) {
      conditions.push('b.status = ?');
      params.push(filters.status);
    }

    if (filters?.competence) {
      conditions.push('b.competence = ?');
      params.push(filters.competence);
    }

    if (filters?.dueDateFrom) {
      conditions.push('b.due_date >= ?');
      params.push(filters.dueDateFrom);
    }

    if (filters?.dueDateTo) {
      conditions.push('b.due_date <= ?');
      params.push(filters.dueDateTo);
    }

    if (filters?.professorId !== undefined) {
      conditions.push('c.professor_id = ?');
      params.push(filters.professorId);
    }

    if (filters?.classId !== undefined) {
      conditions.push('c.id = ?');
      params.push(filters.classId);
    }

    if (filters?.studentId !== undefined) {
      conditions.push('s.id = ?');
      params.push(filters.studentId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        b.*,
        e.student_id,
        s.name AS student_name,
        e.class_id,
        c.name AS class_name,
        c.professor_id,
        p.name AS professor_name,
        pay.amount_paid,
        pay.payment_date,
        pay.payment_method
      FROM monthly_bills b
      JOIN enrollments e ON e.id = b.enrollment_id
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      JOIN professors p ON p.id = c.professor_id
      LEFT JOIN payments pay ON pay.monthly_bill_id = b.id
      ${whereClause}
      ORDER BY b.due_date DESC
    `;

    return db.prepare(sql).all(...params) as unknown as MonthlyBillWithDetails[];
  }

  createBill(dto: CreateMonthlyBillDTO): MonthlyBill {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO monthly_bills (
        enrollment_id, competence, nominal_amount, due_date, status,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.enrollment_id,
      dto.competence,
      dto.nominal_amount,
      dto.due_date,
      dto.status ?? 'PENDING',
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    return db.prepare('SELECT * FROM monthly_bills WHERE id = ?').get(insertedId) as unknown as MonthlyBill;
  }

  recordPayment(dto: CreatePaymentDTO): Payment {
    const db = getDatabase();

    db.exec('BEGIN IMMEDIATE;');
    try {
      const bill = db.prepare('SELECT status FROM monthly_bills WHERE id = ?').get(dto.monthly_bill_id) as
        | { status: string }
        | undefined;

      if (!bill) {
        throw new Error('Mensalidade não encontrada.');
      }

      if (bill.status === 'PAID') {
        throw new Error('Esta mensalidade já foi liquidada.');
      }

      if (bill.status === 'CANCELLED') {
        throw new Error('Não é permitido receber pagamento de mensalidade cancelada.');
      }

      const now = new Date().toISOString();
      const paymentDate = dto.payment_date || now.slice(0, 10);

      const payStmt = db.prepare(`
        INSERT INTO payments (
          monthly_bill_id, amount_paid, payment_date,
          payment_method, received_by_user_id, reference_code,
          notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const res = payStmt.run(
        dto.monthly_bill_id,
        dto.amount_paid,
        paymentDate,
        dto.payment_method,
        dto.received_by_user_id,
        dto.reference_code?.trim() ?? '',
        dto.notes?.trim() ?? '',
        now
      );

      const updateStmt = db.prepare(`
        UPDATE monthly_bills
        SET status = 'PAID', updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(now, dto.monthly_bill_id);

      db.exec('COMMIT;');

      const paymentId = Number(res.lastInsertRowid);
      return db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as unknown as Payment;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  getFinancialSummary(periodStart?: string, periodEnd?: string, professorId?: number): FinancialSummary {
    const db = getDatabase();

    // 1. Total Recebido (Payments)
    const payConditions: string[] = [];
    const payParams: (string | number)[] = [];

    let paySql = `
      SELECT COALESCE(SUM(p.amount_paid), 0) AS total
      FROM payments p
      JOIN monthly_bills b ON b.id = p.monthly_bill_id
      JOIN enrollments e ON e.id = b.enrollment_id
      JOIN classes c ON c.id = e.class_id
    `;

    if (professorId !== undefined) {
      payConditions.push('c.professor_id = ?');
      payParams.push(professorId);
    }
    if (periodStart && periodEnd) {
      payConditions.push('p.payment_date >= ? AND p.payment_date <= ?');
      payParams.push(periodStart, periodEnd);
    } else if (periodStart) {
      payConditions.push('p.payment_date >= ?');
      payParams.push(periodStart);
    } else if (periodEnd) {
      payConditions.push('p.payment_date <= ?');
      payParams.push(periodEnd);
    }

    if (payConditions.length > 0) {
      paySql += ` WHERE ${payConditions.join(' AND ')}`;
    }
    const payRow = db.prepare(paySql).get(...payParams) as unknown as { total: number } | undefined;
    const totalReceived = Number(payRow?.total ?? 0);

    // 2. Total Pendente (Monthly Bills PENDING)
    const pendConditions: string[] = ["b.status = 'PENDING'"];
    const pendParams: (string | number)[] = [];

    let pendSql = `
      SELECT COALESCE(SUM(b.nominal_amount), 0) AS total
      FROM monthly_bills b
      JOIN enrollments e ON e.id = b.enrollment_id
      JOIN classes c ON c.id = e.class_id
    `;

    if (professorId !== undefined) {
      pendConditions.push('c.professor_id = ?');
      pendParams.push(professorId);
    }
    if (periodStart && periodEnd) {
      pendConditions.push('b.due_date >= ? AND b.due_date <= ?');
      pendParams.push(periodStart, periodEnd);
    } else if (periodStart) {
      pendConditions.push('b.due_date >= ?');
      pendParams.push(periodStart);
    } else if (periodEnd) {
      pendConditions.push('b.due_date <= ?');
      pendParams.push(periodEnd);
    }

    pendSql += ` WHERE ${pendConditions.join(' AND ')}`;
    const pendRow = db.prepare(pendSql).get(...pendParams) as unknown as { total: number } | undefined;
    const totalPending = Number(pendRow?.total ?? 0);

    // 3. Total Vencido (Monthly Bills OVERDUE)
    const overdueConditions: string[] = ["b.status = 'OVERDUE'"];
    const overdueParams: (string | number)[] = [];

    let overdueSql = `
      SELECT COALESCE(SUM(b.nominal_amount), 0) AS total
      FROM monthly_bills b
      JOIN enrollments e ON e.id = b.enrollment_id
      JOIN classes c ON c.id = e.class_id
    `;

    if (professorId !== undefined) {
      overdueConditions.push('c.professor_id = ?');
      overdueParams.push(professorId);
    }
    if (periodStart && periodEnd) {
      overdueConditions.push('b.due_date >= ? AND b.due_date <= ?');
      overdueParams.push(periodStart, periodEnd);
    } else if (periodStart) {
      overdueConditions.push('b.due_date >= ?');
      overdueParams.push(periodStart);
    } else if (periodEnd) {
      overdueConditions.push('b.due_date <= ?');
      overdueParams.push(periodEnd);
    }

    overdueSql += ` WHERE ${overdueConditions.join(' AND ')}`;
    const overdueRow = db.prepare(overdueSql).get(...overdueParams) as unknown as { total: number } | undefined;
    const totalOverdue = Number(overdueRow?.total ?? 0);

    // 4. Total Despesas (Expenses) - Restrito a visão global (ADMIN)
    let totalExpenses = 0;
    if (professorId === undefined) {
      let expSql = 'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses';
      const expParams: string[] = [];
      if (periodStart && periodEnd) {
        expSql += ' WHERE expense_date >= ? AND expense_date <= ?';
        expParams.push(periodStart, periodEnd);
      } else if (periodStart) {
        expSql += ' WHERE expense_date >= ?';
        expParams.push(periodStart);
      } else if (periodEnd) {
        expSql += ' WHERE expense_date <= ?';
        expParams.push(periodEnd);
      }
      const expRow = db.prepare(expSql).get(...expParams) as unknown as { total: number } | undefined;
      totalExpenses = Number(expRow?.total ?? 0);
    }

    return {
      totalReceived,
      totalPending,
      totalOverdue,
      totalExpenses,
      netBalance: totalReceived - totalExpenses,
      periodStart,
      periodEnd,
    };
  }
}

export const billingRepository = new BillingRepository();
