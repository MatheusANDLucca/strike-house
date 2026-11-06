import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT, HOST, DB_PATH } from './config.js';
import { getDatabase, closeDatabase } from './database/connection.js';
import { authService } from './services/authService.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  authRoutes,
  studentRoutes,
  classRoutes,
  enrollmentRoutes,
  billingRoutes,
  graduationRoutes,
  expenseRoutes,
  professorRoutes,
  martialArtRoutes,
  dashboardRoutes,
  backupRoutes,
} from './routes/index.js';

async function bootstrap() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: '*',
  });

  // Inicializar e migrar banco de dados SQLite nativo
  console.log(`[database] Inicializando banco de dados em: ${DB_PATH}`);
  const db = getDatabase();
  console.log('[database] Banco de dados e migrações carregados com sucesso.');

  // Semear Administrador Padrão inicial caso não exista
  authService.seedInitialAdmin();

  // Endpoint de integridade (healthcheck com SELECT 1)
  app.get('/health', async (request, reply) => {
    try {
      const activeDb = getDatabase();
      activeDb.prepare('SELECT 1 as alive').get();
      return reply.send({
        status: 'ok',
        service: 'strike-house-api',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro na verificação de banco de dados.';
      return reply.status(500).send({
        status: 'error',
        service: 'strike-house-api',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: message,
      });
    }
  });

  // Registro de Rotas da API REST
  await app.register(authRoutes);
  await app.register(studentRoutes);
  await app.register(classRoutes);
  await app.register(enrollmentRoutes);
  await app.register(billingRoutes);
  await app.register(graduationRoutes);
  await app.register(expenseRoutes);
  await app.register(professorRoutes);
  await app.register(martialArtRoutes);
  await app.register(dashboardRoutes);
  await app.register(backupRoutes);

  // Servir frontend compilado estático (SPA fallback)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidateDist = path.resolve(__dirname, 'public');
  const candidateCwd = path.resolve(process.cwd(), 'dist/public');
  const publicPath = fs.existsSync(candidateDist) ? candidateDist : (fs.existsSync(candidateCwd) ? candidateCwd : candidateDist);

  if (fs.existsSync(publicPath)) {
    await app.register(fastifyStatic, {
      root: publicPath,
      prefix: '/',
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url && request.raw.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'Endpoint da API não encontrado.' });
      }
      return reply.sendFile('index.html');
    });
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n[server] Recebido sinal ${signal}, encerrando graciosamente...`);
      try {
        await app.close();
        closeDatabase();
        console.log('[server] Servidor e conexões encerrados.');
        process.exit(0);
      } catch (err) {
        console.error('[server] Erro durante encerramento:', err);
        process.exit(1);
      }
    });
  }

  try {
    const address = await app.listen({ port: PORT, host: HOST });
    console.log(`🥊 Strike House API rodando em ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
