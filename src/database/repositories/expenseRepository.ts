import { getDatabase } from '../connection.js';
import type {
  Expense,
  ExpenseWithUser,
  CreateExpenseDTO,
} from '../../types/index.js';

export interface ExpenseListFilter {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export class ExpenseRepository {
  list(filter?: ExpenseListFilter): ExpenseWithUser[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.category) {
      conditions.push('e.category = ?');
      params.push(filter.category.trim());
    }

    if (filter?.startDate) {
      conditions.push('e.expense_date >= ?');
      params.push(filter.startDate);
    }

    if (filter?.endDate) {
      conditions.push('e.expense_date <= ?');
      params.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        e.*,
        u.name AS created_by_user_name
      FROM expenses e
      JOIN users u ON u.id = e.created_by_user_id
      ${whereClause}
      ORDER BY e.expense_date DESC
    `;

    return db.prepare(sql).all(...params) as unknown as ExpenseWithUser[];
  }

  create(dto: CreateExpenseDTO): Expense {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO expenses (
        description, category, amount, expense_date,
        notes, created_by_user_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.description.trim(),
      dto.category.trim(),
      dto.amount,
      dto.expense_date,
      dto.notes?.trim() ?? '',
      dto.created_by_user_id,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(insertedId) as unknown as Expense;
  }

  getMonthlyTotal(yearMonth: string): number {
    const db = getDatabase();
    const pattern = `${yearMonth.trim()}%`;
    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE expense_date LIKE ?
    `).get(pattern) as unknown as { total: number } | undefined;

    return Number(row?.total ?? 0);
  }
}

export const expenseRepository = new ExpenseRepository();
