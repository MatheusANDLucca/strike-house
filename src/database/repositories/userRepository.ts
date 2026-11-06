import { getDatabase } from '../connection.js';
import type { User, UserPublic, CreateUserDTO, UpdateUserDTO } from '../../types/index.js';

export class UserRepository {
  findById(id: number): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as unknown as User | undefined;
    return row ?? null;
  }

  findByEmail(email: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    const row = stmt.get(email.trim()) as unknown as User | undefined;
    return row ?? null;
  }

  create(dto: CreateUserDTO): User {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.name.trim(),
      dto.email.trim().toLowerCase(),
      dto.password_hash,
      dto.role,
      dto.is_active ?? 1,
      now,
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.findById(insertedId);
    if (!created) {
      throw new Error(`Falha ao recuperar usuário inserido com id ${insertedId}`);
    }
    return created;
  }

  update(id: number, dto: UpdateUserDTO): User | null {
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
    if (dto.email !== undefined) {
      fields.push('email = ?');
      values.push(dto.email.trim().toLowerCase());
    }
    if (dto.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(dto.password_hash);
    }
    if (dto.role !== undefined) {
      fields.push('role = ?');
      values.push(dto.role);
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

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return this.findById(id);
  }

  list(): UserPublic[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      ORDER BY name ASC
    `);
    return stmt.all() as unknown as UserPublic[];
  }
}

export const userRepository = new UserRepository();
