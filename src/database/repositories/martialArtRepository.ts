import { getDatabase } from '../connection.js';
import type {
  MartialArt,
  CreateMartialArtDTO,
  UpdateMartialArtDTO,
} from '../../types/index.js';

export class MartialArtRepository {
  findById(id: number): MartialArt | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM martial_arts WHERE id = ?');
    const row = stmt.get(id) as unknown as MartialArt | undefined;
    return row ?? null;
  }

  list(activeOnly?: boolean): MartialArt[] {
    const db = getDatabase();
    if (activeOnly) {
      const stmt = db.prepare('SELECT * FROM martial_arts WHERE is_active = 1 ORDER BY name ASC');
      return stmt.all() as unknown as MartialArt[];
    }
    const stmt = db.prepare('SELECT * FROM martial_arts ORDER BY name ASC');
    return stmt.all() as unknown as MartialArt[];
  }

  create(dto: CreateMartialArtDTO): MartialArt {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO martial_arts (name, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.name.trim(),
      dto.description?.trim() ?? '',
      dto.is_active ?? 1,
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.findById(insertedId);
    if (!created) {
      throw new Error(`Falha ao recuperar arte marcial inserida com id ${insertedId}`);
    }
    return created;
  }

  update(id: number, dto: UpdateMartialArtDTO): MartialArt | null {
    const existing = this.findById(id);
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
    if (dto.description !== undefined) {
      fields.push('description = ?');
      values.push(dto.description.trim());
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

    const sql = `UPDATE martial_arts SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return this.findById(id);
  }
}

export const martialArtRepository = new MartialArtRepository();
