import { getDatabase } from '../connection.js';
import type {
  Enrollment,
  EnrollmentWithDetails,
  EnrollmentStatus,
  CreateEnrollmentDTO,
} from '../../types/index.js';

export class EnrollmentRepository {
  findById(id: number): EnrollmentWithDetails | null {
    const db = getDatabase();
    const sql = `
      SELECT
        e.*,
        s.name AS student_name,
        c.name AS class_name,
        m.name AS martial_art_name,
        p.name AS professor_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      JOIN martial_arts m ON m.id = c.martial_art_id
      JOIN professors p ON p.id = c.professor_id
      WHERE e.id = ?
    `;
    const row = db.prepare(sql).get(id) as unknown as EnrollmentWithDetails | undefined;
    return row ?? null;
  }

  listByStudent(studentId: number): EnrollmentWithDetails[] {
    const db = getDatabase();
    const sql = `
      SELECT
        e.*,
        s.name AS student_name,
        c.name AS class_name,
        m.name AS martial_art_name,
        p.name AS professor_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      JOIN martial_arts m ON m.id = c.martial_art_id
      JOIN professors p ON p.id = c.professor_id
      WHERE e.student_id = ?
      ORDER BY e.created_at DESC
    `;
    return db.prepare(sql).all(studentId) as unknown as EnrollmentWithDetails[];
  }

  listByClass(classId: number): EnrollmentWithDetails[] {
    const db = getDatabase();
    const sql = `
      SELECT
        e.*,
        s.name AS student_name,
        c.name AS class_name,
        m.name AS martial_art_name,
        p.name AS professor_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      JOIN martial_arts m ON m.id = c.martial_art_id
      JOIN professors p ON p.id = c.professor_id
      WHERE e.class_id = ?
      ORDER BY s.name ASC
    `;
    return db.prepare(sql).all(classId) as unknown as EnrollmentWithDetails[];
  }

  list(filters?: { studentId?: number; classId?: number; status?: EnrollmentStatus }): EnrollmentWithDetails[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.studentId !== undefined) {
      conditions.push('e.student_id = ?');
      params.push(filters.studentId);
    }

    if (filters?.classId !== undefined) {
      conditions.push('e.class_id = ?');
      params.push(filters.classId);
    }

    if (filters?.status !== undefined) {
      conditions.push('e.status = ?');
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        e.*,
        s.name AS student_name,
        c.name AS class_name,
        m.name AS martial_art_name,
        p.name AS professor_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      JOIN martial_arts m ON m.id = c.martial_art_id
      JOIN professors p ON p.id = c.professor_id
      ${whereClause}
      ORDER BY e.created_at DESC
    `;

    return db.prepare(sql).all(...params) as unknown as EnrollmentWithDetails[];
  }

  listActive(): EnrollmentWithDetails[] {
    return this.list({ status: 'ACTIVE' });
  }


  create(dto: CreateEnrollmentDTO): Enrollment {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO enrollments (
        student_id, class_id, due_day, custom_price,
        start_date, end_date, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.student_id,
      dto.class_id,
      dto.due_day ?? 10,
      dto.custom_price ?? null,
      dto.start_date,
      dto.end_date ?? null,
      dto.status ?? 'ACTIVE',
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    return db.prepare('SELECT * FROM enrollments WHERE id = ?').get(insertedId) as unknown as Enrollment;
  }

  updateStatus(id: number, status: EnrollmentStatus, endDate?: string): Enrollment | null {
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id) as unknown as Enrollment | undefined;
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const resolvedEndDate = endDate !== undefined ? endDate : existing.end_date;

    const stmt = db.prepare(`
      UPDATE enrollments
      SET status = ?, end_date = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(status, resolvedEndDate, now, id);
    return db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id) as unknown as Enrollment;
  }
}

export const enrollmentRepository = new EnrollmentRepository();
