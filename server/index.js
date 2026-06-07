require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./config/db');
const sanitize = require('./middleware/sanitize');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Headers (Helmet) ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow image loading from external sources
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
}));

// ─── CORS — Restrict to Approved Origins ────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. server-to-server, Postman in dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600, // Cache preflight for 10 minutes
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p so\'rov yuborildi. Iltimos, keyinroq urinib ko\'ring.' },
});
app.use('/api/', generalLimiter);

// Strict rate limit for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p autentifikatsiya urinishi. 15 daqiqa kutib turing.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// OTP rate limit
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 OTP requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p OTP so\'rovi. 5 daqiqa kutib turing.' },
});
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);

// ─── Request Body Limits ────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// ─── Input Sanitization ─────────────────────────────────────────────────────
app.use(sanitize);

// ─── Request Logger (non-sensitive) ─────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Root Health Check ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Wedding Hall Booking API Server is running' });
});

// ─── Register API Routes ────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/halls', require('./routes/halls'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/testEmail'));

// ─── 404 Fallback ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Ruxsat etilmagan manba' });
  }
  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Yaroqsiz so\'rov formati' });
  }
  // Request too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'So\'rov hajmi juda katta' });
  }
  // Generic — never leak internal details
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Tizim xatoligi yuz berdi' });
});

let server;

// ─── Start Server ───────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    console.log('Connecting to PostgreSQL database...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ PostgreSQL Database Connected Successfully");

    server = app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(`  Backend API Server running on port ${PORT} `);
      console.log(`  http://localhost:${PORT}                    `);
      console.log(`  Security: Helmet, CORS, Rate Limiting ON   `);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error("❌ Database Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
