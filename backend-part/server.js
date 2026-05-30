const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const dotenv    = require('dotenv');
const path      = require('path');
const fs        = require('fs');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Security headers — allow cross-origin images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS — allow all in dev
app.use(cors({
  origin: (_origin, cb) => cb(null, true),
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Static file serving for uploaded images
// Accessible at: http://localhost:5000/uploads/filename.jpg
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/vendors',    require('./routes/vendors'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/offers',     require('./routes/offers'));
app.use('/api/categories', require('./routes/categories'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: '24HxChange API is running 🚀', timestamp: new Date() })
);

// Debug: list uploads (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/uploads', (req, res) => {
    try {
      const files = fs.existsSync(uploadsDir)
        ? fs.readdirSync(uploadsDir).map(f => ({
            name: f,
            url: `/uploads/${f}`,
            full: `http://localhost:${process.env.PORT || 5000}/uploads/${f}`,
          }))
        : [];
      res.json({ success: true, count: files.length, uploadsDir, files });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
}

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` })
);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('❌', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Server:   http://localhost:${PORT}`);
  console.log(`📁  Uploads:  http://localhost:${PORT}/uploads`);
  console.log(`🔧  Debug:    http://localhost:${PORT}/api/debug/uploads`);
  console.log(`🌐  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});
