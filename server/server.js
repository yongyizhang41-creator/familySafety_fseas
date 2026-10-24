import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initFirebase } from './src/config/firebase.js';
import initSocketHandlers from './src/sockets/socket.handler.js';
import { startLocationPurgeJob } from './src/jobs/purgeLocations.job.js';
import { clientOrigin } from './src/config/origin.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    credentials: true,
  },
});

// Setup socket logic
initSocketHandlers(io);

// Start server block
const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Initialize Firebase Admin
    initFirebase();

    // 3. Start cron jobs
    startLocationPurgeJob();

    // 4. Start HTTP & WebSocket Server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
