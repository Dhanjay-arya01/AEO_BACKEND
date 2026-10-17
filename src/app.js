import express from 'express';
import cors from 'cors';
import { CORS_ORIGIN } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'SiteUp Main Backend API',
    version: '1.0.0',
    description: 'SEO & AEO Audit and Content Optimization SaaS Backend',
    documentation: '/api/health',
    status: 'ONLINE',
  });
});

// Mount all API endpoints under /api
app.use('/api', apiRoutes);

// Catch 404s
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;