import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { getDatabase } from '../database/connection.js';
import { userRepository, professorRepository } from '../database/repositories/index.js';
import type { AuthContext, LoginResponseDTO } from '../types/index.js';

export class AuthService {
  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }


  verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      return false;
    }
    const [salt, hash] = parts;
    const derived = scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');
    if (derived.length !== storedBuffer.length) {
      return false;
    }
    return timingSafeEqual(derived, storedBuffer);
  }

  login(email: string, password: string): LoginResponseDTO {
    const user = userRepository.findByEmail(email);
    if (!user || user.is_active !== 1) {
      throw new Error('Credenciais inválidas.');
    }

    const isValid = this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Credenciais inválidas.');
    }

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const createdAt = now.toISOString();
    // Sessão válida por 7 dias
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO user_sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(token, user.id, createdAt, expiresAt);


    let professorId: number | null = null;
    if (user.role === 'PROFESSOR') {
      const prof = professorRepository.findByUserId(user.id);
      professorId = prof ? prof.id : null;
    }

    const { password_hash, ...publicUser } = user;

    return {
      token,
      user: {
        ...publicUser,
        professor_id: professorId,
      },
    };
  }

  validateSession(token: string): AuthContext | null {
    if (!token) return null;
    const db = getDatabase();
    const now = new Date().toISOString();

    const sessionRow = db
      .prepare('SELECT user_id, expires_at FROM user_sessions WHERE token = ?')
      .get(token) as { user_id: number; expires_at: string } | undefined;

    if (!sessionRow) {
      return null;
    }

    if (sessionRow.expires_at < now) {
      db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
      return null;
    }

    const user = userRepository.findById(sessionRow.user_id);
    if (!user || user.is_active !== 1) {
      return null;
    }

    let professorId: number | null = null;
    if (user.role === 'PROFESSOR') {
      const prof = professorRepository.findByUserId(user.id);
      professorId = prof ? prof.id : null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      professorId,
    };
  }

  logout(token: string): boolean {
    if (!token) return false;
    const db = getDatabase();
    const res = db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
    return Number(res.changes) > 0;
  }

  seedInitialAdmin(): void {
    const email = 'admin@strikehouse.com';
    const existing = userRepository.findByEmail(email);

    if (!existing) {
      console.log('[auth] Criando administrador inicial (admin@strikehouse.com)...');
      userRepository.create({
        name: 'Administrador Strike House',
        email,
        password_hash: this.hashPassword('admin123'),
        role: 'ADMIN',
        is_active: 1,
      });
      console.log('[auth] Administrador inicial criado com sucesso.');
    } else if (!existing.password_hash.includes(':')) {
      // Atualiza hash legado ou sem salt para scrypt seguro
      console.log('[auth] Atualizando hash da senha do administrador inicial para scrypt seguro...');
      userRepository.update(existing.id, {
        password_hash: this.hashPassword('admin123'),
      });
    }
  }
}


export const authService = new AuthService();
