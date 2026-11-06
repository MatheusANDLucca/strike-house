import { getDatabase } from '../connection.js';
import type {
  ClassEntity,
  ClassWithDetails,
  CreateClassDTO,
  UpdateClassDTO,
} from '../../types/index.js';

export interface ClassListFilter {
  professorId?: number;
  martialArtId?: number;
  activeOnly?: boolean;
}

export class ClassRepository {
  findById(id: number): ClassWithDetails | null {
    const db = getDatabase();
    const sql = `
      SELECT
        c.*,
        m.name AS martial_art_name,
        p.name AS professor_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS enrolled_count
      FROM classes c
      JOIN martial_arts m ON m.id = c.martial_art_id
      JOIN professors p ON p.id = c.professor_id
      WHERE c.id = ?
    `;
    const row = db.prepare(sql).get(id) as unknown as ClassWithDetails | undefined;
    return row ?? null;
  }

  list(filter?: ClassListFilter): ClassWithDetails[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.professorId !== undefined) {
      conditions.push('c.professor_id = ?');
      params.push(filter.professorId);
    }

    if (filter?.martialArtId !== undefined) {
      conditions.push('c.martial_art_id = ?');
      params.push(filter.martialArtId);
    }

    if (filter?.activeOnly) {
      conditions.push('c.is_active = 1');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        c.*,
        m.name AS martial_art_name,
        p.name AS professor_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS enrolled_count
      FROM classes c
      JOIN martial_arts m ON m.id = c.martial_art_id
      JOIN professors p ON p.id = c.professor_id
      ${whereClause}
      ORDER BY c.name ASC
    `;

    return db.prepare(sql).all(...params) as unknown as ClassWithDetails[];
  }

  create(dto: CreateClassDTO): ClassEntity {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO classes (
        name, martial_art_id, professor_id, age_group, week_days,
        start_time, end_time, max_capacity, monthly_fee, is_active,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.name.trim(),
      dto.martial_art_id,
      dto.professor_id,
      dto.age_group,
      dto.week_days.trim(),
      dto.start_time.trim(),
      dto.end_time.trim(),
      dto.max_capacity ?? 30,
      dto.monthly_fee,
      dto.is_active ?? 1,
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    return db.prepare('SELECT * FROM classes WHERE id = ?').get(insertedId) as unknown as ClassEntity;
  }

  update(id: number, dto: UpdateClassDTO): ClassEntity | null {
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(id) as unknown as ClassEntity | undefined;
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name.trim());
    }
    if (dto.martial_art_id !== undefined) {
      fields.push('martial_art_id = ?');
      values.push(dto.martial_art_id);
    }
    if (dto.professor_id !== undefined) {
      fields.push('professor_id = ?');
      values.push(dto.professor_id);
    }
    if (dto.age_group !== undefined) {
      fields.push('age_group = ?');
      values.push(dto.age_group);
    }
    if (dto.week_days !== undefined) {
      fields.push('week_days = ?');
      values.push(dto.week_days.trim());
    }
    if (dto.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(dto.start_time.trim());
    }
    if (dto.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(dto.end_time.trim());
    }
    if (dto.max_capacity !== undefined) {
      fields.push('max_capacity = ?');
      values.push(dto.max_capacity);
    }
    if (dto.monthly_fee !== undefined) {
      fields.push('monthly_fee = ?');
      values.push(dto.monthly_fee);
    }
    if (dto.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(dto.is_active);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return db.prepare('SELECT * FROM classes WHERE id = ?').get(id) as unknown as ClassEntity;
  }
}

export const classRepository = new ClassRepository();
