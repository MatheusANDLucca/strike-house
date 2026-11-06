import { getDatabase } from '../connection.js';
import type {
  Graduation,
  GraduationWithDetails,
  CreateGraduationDTO,
} from '../../types/index.js';

export class GraduationRepository {
  listAll(professorId?: number): GraduationWithDetails[] {
    const db = getDatabase();
    if (professorId !== undefined) {
      const sql = `
        SELECT
          g.*,
          s.name AS student_name,
          m.name AS martial_art_name,
          p.name AS professor_name
        FROM graduations g
        JOIN students s ON s.id = g.student_id
        JOIN martial_arts m ON m.id = g.martial_art_id
        JOIN professors p ON p.id = g.professor_id
        WHERE g.professor_id = ?
        ORDER BY g.awarded_at DESC, g.id DESC
      `;
      return db.prepare(sql).all(professorId) as unknown as GraduationWithDetails[];
    }

    const sql = `
      SELECT
        g.*,
        s.name AS student_name,
        m.name AS martial_art_name,
        p.name AS professor_name
      FROM graduations g
      JOIN students s ON s.id = g.student_id
      JOIN martial_arts m ON m.id = g.martial_art_id
      JOIN professors p ON p.id = g.professor_id
      ORDER BY g.awarded_at DESC, g.id DESC
    `;
    return db.prepare(sql).all() as unknown as GraduationWithDetails[];
  }

  listByStudent(studentId: number): GraduationWithDetails[] {
    const db = getDatabase();
    const sql = `
      SELECT
        g.*,
        s.name AS student_name,
        m.name AS martial_art_name,
        p.name AS professor_name
      FROM graduations g
      JOIN students s ON s.id = g.student_id
      JOIN martial_arts m ON m.id = g.martial_art_id
      JOIN professors p ON p.id = g.professor_id
      WHERE g.student_id = ?
      ORDER BY g.awarded_at DESC
    `;
    return db.prepare(sql).all(studentId) as unknown as GraduationWithDetails[];
  }

  create(dto: CreateGraduationDTO): Graduation {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO graduations (
        student_id, martial_art_id, previous_grade,
        new_grade, awarded_at, professor_id, notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.student_id,
      dto.martial_art_id,
      dto.previous_grade?.trim() ?? '',
      dto.new_grade.trim(),
      dto.awarded_at,
      dto.professor_id,
      dto.notes?.trim() ?? '',
      now
    );

    const insertedId = Number(result.lastInsertRowid);
    return db.prepare('SELECT * FROM graduations WHERE id = ?').get(insertedId) as unknown as Graduation;
  }
}

export const graduationRepository = new GraduationRepository();
