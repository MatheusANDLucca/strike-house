import { getDatabase } from '../connection.js';
import type {
  Student,
  StudentWithGuardians,
  Guardian,
  CreateStudentDTO,
  UpdateStudentDTO,
  CreateGuardianDTO,
} from '../../types/index.js';

export interface StudentListFilter {
  status?: string;
  search?: string;
}

export class StudentRepository {
  findById(id: number): StudentWithGuardians | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM students WHERE id = ?');
    const student = stmt.get(id) as unknown as Student | undefined;

    if (!student) {
      return null;
    }

    const guardians = this.getGuardians(id);
    return {
      ...student,
      guardians,
    };
  }

  list(filter?: StudentListFilter): Student[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }

    if (filter?.search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const searchPattern = `%${filter.search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM students ${whereClause} ORDER BY name ASC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params) as unknown as Student[];
  }

  listByProfessor(professorId: number, filter?: StudentListFilter): Student[] {
    const db = getDatabase();
    const conditions: string[] = ['c.professor_id = ?'];
    const params: (string | number)[] = [professorId];

    if (filter?.status) {
      conditions.push('s.status = ?');
      params.push(filter.status);
    }

    if (filter?.search) {
      conditions.push('(s.name LIKE ? OR s.phone LIKE ? OR s.email LIKE ?)');
      const searchPattern = `%${filter.search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const sql = `
      SELECT DISTINCT s.*
      FROM students s
      JOIN enrollments e ON e.student_id = s.id
      JOIN classes c ON c.id = e.class_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.name ASC
    `;

    return db.prepare(sql).all(...params) as unknown as Student[];
  }

  isStudentEnrolledWithProfessor(studentId: number, professorId: number): boolean {
    const db = getDatabase();
    const sql = `
      SELECT COUNT(*) as count
      FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND c.professor_id = ?
    `;
    const row = db.prepare(sql).get(studentId, professorId) as { count: number } | undefined;
    return (row?.count ?? 0) > 0;
  }


  create(dto: CreateStudentDTO): Student {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO students (name, birth_date, phone, email, address, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.name.trim(),
      dto.birth_date,
      dto.phone?.trim() ?? '',
      dto.email?.trim() ?? '',
      dto.address?.trim() ?? '',
      dto.status ?? 'ACTIVE',
      dto.notes?.trim() ?? '',
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(insertedId) as unknown as Student;
    return created;
  }

  update(id: number, dto: UpdateStudentDTO): Student | null {
    const existing = dbCheckStudent(id);
    if (!existing) {
      return null;
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name.trim());
    }
    if (dto.birth_date !== undefined) {
      fields.push('birth_date = ?');
      values.push(dto.birth_date);
    }
    if (dto.phone !== undefined) {
      fields.push('phone = ?');
      values.push(dto.phone.trim());
    }
    if (dto.email !== undefined) {
      fields.push('email = ?');
      values.push(dto.email.trim());
    }
    if (dto.address !== undefined) {
      fields.push('address = ?');
      values.push(dto.address.trim());
    }
    if (dto.status !== undefined) {
      fields.push('status = ?');
      values.push(dto.status);
    }
    if (dto.notes !== undefined) {
      fields.push('notes = ?');
      values.push(dto.notes.trim());
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return db.prepare('SELECT * FROM students WHERE id = ?').get(id) as unknown as Student;
  }

  linkGuardian(studentId: number, dto: CreateGuardianDTO): Guardian {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.exec('BEGIN IMMEDIATE;');
    try {
      const guardianStmt = db.prepare(`
        INSERT INTO guardians (name, phone, email, relationship, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const res = guardianStmt.run(
        dto.name.trim(),
        dto.phone.trim(),
        dto.email?.trim() ?? '',
        dto.relationship?.trim() ?? 'Responsável',
        dto.notes?.trim() ?? '',
        now
      );

      const guardianId = Number(res.lastInsertRowid);

      const linkStmt = db.prepare(`
        INSERT INTO student_guardians (student_id, guardian_id)
        VALUES (?, ?)
      `);
      linkStmt.run(studentId, guardianId);

      db.exec('COMMIT;');

      const created = db.prepare('SELECT * FROM guardians WHERE id = ?').get(guardianId) as unknown as Guardian;
      return created;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  getGuardians(studentId: number): Guardian[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT g.*
      FROM guardians g
      JOIN student_guardians sg ON sg.guardian_id = g.id
      WHERE sg.student_id = ?
      ORDER BY g.id ASC
    `);
    return stmt.all(studentId) as unknown as Guardian[];
  }
}

function dbCheckStudent(id: number): Student | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as unknown as Student | undefined;
  return row ?? null;
}

export const studentRepository = new StudentRepository();
