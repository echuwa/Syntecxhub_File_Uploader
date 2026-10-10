import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, closeDB, getBucket, getDb } from './config/db.js';
import fileRoutes from './routes/fileRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
}));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = getDb();
    const adminDb = db.admin();
    const pingResult = await adminDb.ping();

    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: pingResult.ok === 1 ? 'Connected' : 'Degraded',
        databaseName: db.databaseName,
        gridFSBucket: getBucket().bucketName,
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount File Routes
app.use('/api/files', fileRoutes);

// Production Static Serving
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 & Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🚀 SyntecxHub File Uploader API is live!                     ║
║  📡 Server running at: http://localhost:${PORT}                 ║
║  📦 MongoDB GridFS Bucket: active                             ║
║  📂 Upload endpoint: POST http://localhost:${PORT}/api/files/upload ║
║  📊 Stats endpoint:  GET  http://localhost:${PORT}/api/files/stats  ║
║  🩺 Health check:    GET  http://localhost:${PORT}/api/health       ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closeDB();
        console.log('✅ Server and database connections closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

// Automatically start if run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
