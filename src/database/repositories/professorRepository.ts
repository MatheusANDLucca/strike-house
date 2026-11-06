import { getDatabase } from '../connection.js';
import type {
  Professor,
  ProfessorStatus,
  CreateProfessorDTO,
  UpdateProfessorDTO,
} from '../../types/index.js';

export class ProfessorRepository {
  findById(id: number): Professor | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM professors WHERE id = ?');
    const row = stmt.get(id) as unknown as Professor | undefined;
    return row ?? null;
  }

  findByUserId(userId: number): Professor | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM professors WHERE user_id = ?');
    const row = stmt.get(userId) as unknown as Professor | undefined;
    return row ?? null;
  }

  list(status?: ProfessorStatus): Professor[] {
    const db = getDatabase();
    if (status) {
      const stmt = db.prepare('SELECT * FROM professors WHERE status = ? ORDER BY name ASC');
      return stmt.all(status) as unknown as Professor[];
    }
    const stmt = db.prepare('SELECT * FROM professors ORDER BY name ASC');
    return stmt.all() as unknown as Professor[];
  }

  create(dto: CreateProfessorDTO): Professor {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO professors (user_id, name, phone, email, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.user_id ?? null,
      dto.name.trim(),
      dto.phone?.trim() ?? '',
      dto.email?.trim().toLowerCase() ?? '',
      dto.status ?? 'ACTIVE',
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.findById(insertedId);
    if (!created) {
      throw new Error(`Falha ao recuperar professor inserido com id ${insertedId}`);
    }
    return created;
  }

  update(id: number, dto: UpdateProfessorDTO): Professor | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name.trim());
    }
    if (dto.user_id !== undefined) {
      fields.push('user_id = ?');
      values.push(dto.user_id);
    }
    if (dto.phone !== undefined) {
      fields.push('phone = ?');
      values.push(dto.phone.trim());
    }
    if (dto.email !== undefined) {
      fields.push('email = ?');
      values.push(dto.email.trim().toLowerCase());
    }
    if (dto.status !== undefined) {
      fields.push('status = ?');
      values.push(dto.status);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE professors SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return this.findById(id);
  }
}

export const professorRepository = new ProfessorRepository();
