import { getRabbitChannel } from '../config/rabbitmq.js';
import { RABBITMQ_AUDIT_QUEUE } from '../config/env.js';

/**
 * Publishes a versioned audit job to RabbitMQ with persistent delivery.
 * 
 * @param {Object} jobData
 * @param {string} jobData.jobId - Unique, retry-safe job ID
 * @param {string} jobData.auditId - Database Audit ID
 * @param {string} jobData.projectId - Database Project ID
 * @param {string} jobData.ownerId - Owner User ID
 * @param {string} [jobData.jobType='FULL_AUDIT'] - Type of audit job
 * @param {Object} [jobData.payload={}] - Additional metadata (url, domain, keywords, etc.)
 * @returns {Promise<{ published: boolean, jobId: string, queue: string }>}
 */
export async function publishAuditJob({
  jobId,
  auditId,
  projectId,
  ownerId,
  jobType = 'FULL_AUDIT',
  payload = {},
}) {
  const channel = await getRabbitChannel();

  if (!channel) {
    throw new Error('RabbitMQ channel unavailable. Message broker is currently disconnected.');
  }

  const message = {
    version: '1.0',
    jobId,
    auditId: String(auditId),
    projectId: String(projectId),
    ownerId: String(ownerId),
    jobType,
    createdAt: new Date().toISOString(),
    payload,
  };

  const buffer = Buffer.from(JSON.stringify(message));

  const sent = channel.sendToQueue(RABBITMQ_AUDIT_QUEUE, buffer, {
    persistent: true,
    contentType: 'application/json',
    messageId: jobId,
    timestamp: Date.now(),
    headers: {
      'x-job-type': jobType,
      'x-audit-id': String(auditId),
    },
  });

  if (!sent) {
    throw new Error(`RabbitMQ buffer is full. Failed to enqueue job ${jobId}.`);
  }

  return {
    published: true,
    jobId,
    queue: RABBITMQ_AUDIT_QUEUE,
  };
}

export default {
  publishAuditJob,
};
