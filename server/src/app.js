import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientOrigin } from './config/origin.js';

import authRoutes from './routes/auth.routes.js';
import groupRoutes from './routes/group.routes.js';
import locationRoutes from './routes/location.routes.js';
import sosRoutes from './routes/sos.routes.js';
import safezoneRoutes from './routes/safezone.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';

import errorHandler from './middleware/error.middleware.js';

const app = express();

// ─── Security & Utility Middleware ─────────────────────────────────────────────
app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org', 'https://cdnjs.cloudflare.com'],
      scriptSrc: ["'self'", 'https://www.gstatic.com'],
      connectSrc: ["'self'", clientOrigin, clientOrigin.replace(/^http/, 'ws'), 'https://*.googleapis.com', 'https://*.firebaseio.com'],
      workerSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', data: null });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/safezones', safezoneRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// API errors must stay JSON instead of falling through to the React application.
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found', data: null });
});

// Production serves the React SPA and API from the same HTTPS origin.
if (process.env.NODE_ENV === 'production') {
  const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
