const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const config = require('./src/config');
const { connectMongo } = require('./src/config/db');
const { ensureDir } = require('./src/utils/helpers');
const { setupSecurity } = require('./src/middleware/security.middleware');
const authRoutes = require('./src/routes/auth.routes');
const postRoutes = require('./src/routes/post.routes');
const galleryRoutes = require('./src/routes/gallery.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const streamRoutes = require('./src/routes/stream.routes');

const app = express();

if (!config.auth.jwtSecret) {
  throw new Error('JWT_SECRET is required. Please configure JWT_SECRET in your environment.');
}

// Ensure required directories exist
ensureDir(config.paths.uploads);
ensureDir(config.paths.output);
ensureDir(config.paths.assets);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
setupSecurity(app);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', authRoutes);
app.use('/', postRoutes);
app.use('/', galleryRoutes);
app.use('/', settingsRoutes);
app.use('/', streamRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi hệ thống',
  });
});

async function startServer() {
  try {
    await connectMongo();
    console.log(`✅ MongoDB connected: ${config.mongo.uri}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`🚀 Lumi Lashes Social Media running at http://localhost:${config.port}`);
    console.log(`📌 Brand: ${config.brand.name}`);
    console.log(`📌 Environment: ${config.nodeEnv}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
