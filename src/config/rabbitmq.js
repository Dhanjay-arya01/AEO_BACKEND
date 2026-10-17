import amqp from 'amqplib';
import { RABBITMQ_URL, RABBITMQ_AUDIT_QUEUE } from './env.js';

let connection = null;
let channel = null;
let isConnecting = false;
let reconnectTimer = null;

export async function connectRabbitMQ() {
  if (channel) return { connection, channel };
  if (isConnecting) return null;

  isConnecting = true;
  try {
    connection = await amqp.connect(RABBITMQ_URL, {
      heartbeat: 60,
      clientProperties: {
        connection_name: 'SiteUp_Backend_Publisher',
      },
    });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      cleanupConnection();
      scheduleReconnect();
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed');
      cleanupConnection();
      scheduleReconnect();
    });

    channel = await connection.createChannel();

    channel.on('error', (err) => {
      console.error('RabbitMQ channel error:', err.message);
      channel = null;
    });

    channel.on('close', () => {
      console.warn('RabbitMQ channel closed');
      channel = null;
    });

    // Assert the main audit queue as durable
    await channel.assertQueue(RABBITMQ_AUDIT_QUEUE, {
      durable: true,
    });

    console.log(`RabbitMQ: Connected and queue "${RABBITMQ_AUDIT_QUEUE}" asserted (durable)`);
    isConnecting = false;
    return { connection, channel };
  } catch (error) {
    isConnecting = false;
    cleanupConnection();
    console.warn(`RabbitMQ: Could not connect to ${RABBITMQ_URL} (${error.message}). Reconnection scheduled.`);
    scheduleReconnect();
    return null;
  }
}

function cleanupConnection() {
  channel = null;
  connection = null;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    console.log('RabbitMQ: Attempting reconnect...');
    await connectRabbitMQ();
  }, 10000);
}

export async function getRabbitChannel() {
  if (!channel) {
    const result = await connectRabbitMQ();
    if (result) return result.channel;
    return null;
  }
  return channel;
}

export function isRabbitConnected() {
  return connection !== null && channel !== null;
}

export async function checkQueueStats(queueName = RABBITMQ_AUDIT_QUEUE) {
  if (!channel) {
    return {
      connected: false,
      queue: queueName,
      messageCount: 0,
      consumerCount: 0,
      error: 'Not connected to RabbitMQ',
    };
  }

  try {
    const check = await channel.checkQueue(queueName);
    return {
      connected: true,
      queue: queueName,
      messageCount: check.messageCount,
      consumerCount: check.consumerCount,
    };
  } catch (error) {
    return {
      connected: isRabbitConnected(),
      queue: queueName,
      messageCount: 0,
      consumerCount: 0,
      error: error.message,
    };
  }
}

export async function disconnectRabbitMQ() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('RabbitMQ: Disconnected gracefully');
  } catch (err) {
    console.error('Error disconnecting RabbitMQ:', err.message);
  }
}

export default {
  connectRabbitMQ,
  getRabbitChannel,
  isRabbitConnected,
  checkQueueStats,
  disconnectRabbitMQ,
};
