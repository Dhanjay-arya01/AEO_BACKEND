import { getDatabaseStatus } from '../config/database.js';
import { isRabbitConnected, checkQueueStats } from '../config/rabbitmq.js';
import { sendSuccess } from '../utils/response.util.js';

export async function checkHealth(req, res, next) {
  try {
    const dbStatus = getDatabaseStatus();
    const isDbUp = dbStatus.status === 'connected';
    const isRabbitUp = isRabbitConnected();
    const rabbitStats = await checkQueueStats();

    let overallStatus = 'HEALTHY';
    let httpCode = 200;

    if (!isDbUp && !isRabbitUp) {
      overallStatus = 'DOWN';
      httpCode = 503;
    } else if (!isDbUp || !isRabbitUp) {
      overallStatus = 'DEGRADED';
      httpCode = 200; // Still operational to serve degraded response
    }

    const healthData = {
      status: overallStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      services: {
        database: {
          name: 'MongoDB',
          status: dbStatus.status,
          host: dbStatus.host,
        },
        messageBroker: {
          name: 'RabbitMQ',
          status: isRabbitUp ? 'connected' : 'disconnected',
          queue: rabbitStats.queue,
          pendingMessages: rabbitStats.messageCount,
          activeConsumers: rabbitStats.consumerCount,
        },
      },
    };

    return sendSuccess(res, healthData, `System health is ${overallStatus}`, httpCode);
  } catch (error) {
    next(error);
  }
}

export default {
  checkHealth,
};
