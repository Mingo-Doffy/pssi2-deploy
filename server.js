const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise'); // Ajout du client MySQL
const apiRouter = require('./routes/api');

const app = express();

// Configuration CORS
// Configuration CORS étendue
const allowedOrigins = [
  'http://localhost:3000',    // Frontend React en développement
  'http://localhost:80',      // Frontend sur port standard
  'http://localhost',         // Frontend sans port spécifié
  'https://votre-domaine.com' // Production
];

// Configuration CORS étendue
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (Postman, apps mobiles, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste ou si c'est une origine locale
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('http://localhost') || // Autoriser toutes les variantes localhost
      origin.includes('http://127.0.0.1')    // Autoriser l'accès via IP locale
    ) {
      return callback(null, true);
    }
    
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions)); // Doit être avant les routes

// Routes API
app.use('/api', apiRouter);
// Gestion des erreurs
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Erreur:`, err.stack);

  // Toujours retourner du JSON
  res.setHeader('Content-Type', 'application/json');
  res.status(err.status || 500).send(JSON.stringify({
    error: err.code || 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur est survenue',
    timestamp
  }));
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).send(JSON.stringify({
    error: 'NOT_FOUND',
    message: 'Route non trouvée'
  }));
});

// Rate limiting
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW) || 60;
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX) || 100;

const limiter = rateLimit({
  windowMs: rateLimitWindow * 60 * 1000,
  max: rateLimitMax,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Trop de requêtes depuis cette IP'
  }
});
app.use('/auth', limiter);
app.options('*', cors(corsOptions));

// Health Check avec vérification MySQL
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.status(200).json({
      status: 'OK',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Erreur:`, err.stack);

  res.status(err.status || 500).json({
    error: err.code || 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur est survenue',
    timestamp
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Initialiser la connexion MySQL avant de démarrer le serveur
    global.pool = await initMySQL();
    
    const PORT = parseInt(process.env.PORT) || 5000;
    app.listen(PORT, () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Serveur démarré sur le port ${PORT}`);
      console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Origines CORS autorisées: ${allowedOrigins.join(', ')}`);
    });
  } catch (err) {
    console.error('Échec du démarrage du serveur:', err);
    process.exit(1);
  }
};

startServer();



