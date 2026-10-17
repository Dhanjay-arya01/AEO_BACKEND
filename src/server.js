import dns from 'node:dns';
import app from './app.js';
import { PORT, NODE_ENV } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRabbitMQ, disconnectRabbitMQ } from './config/rabbitmq.js';

// Resolve MongoDB Atlas SRV records reliably (fixes querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Ignore if unsupported in environment
}

let server = null;

async function bootstrap() {
  console.log('='.repeat(55));
  console.log(`Starting SiteUp Main Backend [${NODE_ENV.toUpperCase()}]`);
  console.log('='.repeat(55));

  // Initialize database
  await connectDatabase();

  // Initialize RabbitMQ publisher connection
  await connectRabbitMQ();

  // Start HTTP server
  server = app.listen(PORT, () => {
    console.log(`Server listening at: http://localhost:${PORT}`);
    console.log(`Health check:        http://localhost:${PORT}/api/health`);
    console.log(`API base route:      http://localhost:${PORT}/api`);
    console.log('='.repeat(55));
  });
}

// Graceful shutdown handler
async function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);

  if (server) {
    server.close(() => {
      console.log('HTTP Server closed.');
    });
  }

  await disconnectRabbitMQ();
  await disconnectDatabase();

  console.log('SiteUp Backend shut down cleanly.');
  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();

export default server;
