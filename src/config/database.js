import dns from 'node:dns';
import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records (fixes querySrv ECONNREFUSED on Windows)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('Warning: Unable to configure custom DNS servers:', dnsErr.message);
}

let isConnected = false;

export async function connectDatabase() {
  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('MongoDB: Connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('MongoDB: Connection disconnected');
    });

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    isConnected = false;
    console.error(`MongoDB failed to connect at ${MONGO_URI}:`, error.message);
    // Don't crash immediately in development, allow health check to report status
    return null;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB: Disconnected gracefully');
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseStatus,
};
