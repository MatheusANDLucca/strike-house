import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'node:fs';
import { getDatabase } from '../database/connection.js';
import { DB_PATH } from '../config.js';
import { requireRole } from '../middlewares/authMiddleware.js';

export const backupRoutes: FastifyPluginAsync = async (app) => {
  const handleBackup = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Executa checkpoint WAL TRUNCATE para descarregar o write-ahead log no arquivo .db principal
      const db = getDatabase();
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

      if (!fs.existsSync(DB_PATH)) {
        request.log.error(`Arquivo do banco não encontrado em: ${DB_PATH}`);
        return reply.status(500).send({
          error: 'Arquivo de banco de dados não encontrado no servidor.',
        });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `strike_house_backup_${timestamp}.db`;

      const stream = fs.createReadStream(DB_PATH);

      reply.header('Content-Type', 'application/x-sqlite3');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);

      return reply.send(stream);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha desconhecida no backup.';
      request.log.error({ err }, `Erro ao gerar backup do banco de dados SQLite: ${message}`);
      return reply.status(500).send({
        error: 'Falha ao processar backup do banco de dados SQLite.',
        details: message,
      });
    }
  };

  // Suporte tanto para registro direto quanto com prefixo /api/backup
  if (app.prefix === '/api/backup') {
    app.get('/', { preHandler: [requireRole('ADMIN')] }, handleBackup);
  } else {
    app.get('/api/backup', { preHandler: [requireRole('ADMIN')] }, handleBackup);
  }
};
