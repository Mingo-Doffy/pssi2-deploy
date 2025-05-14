const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise'); // Ajout du client MySQL
const apiRouter = require('./routes/api');

const app = express();

/*/ Configuration CORS
// Configuration CORS étendue
const allowedOrigins = 'https://frontend-production-6406.up.railway.app/';

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin === allowedOrigins) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
*/
// Middlewares de sécurité
app.use(cors());
app.use(helmet());
app.use(express.json());
//app.use(cors(corsOptions));

// Rate limiting
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX);

const limiter = rateLimit({
  windowMs: (isNaN(rateLimitWindow) ? 60 : rateLimitWindow) * 60 * 1000, // Default à 1 heure si non défini
  max: isNaN(rateLimitMax) ? 100 : rateLimitMax, // Default à 100 requêtes si non défini
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Trop de requêtes depuis cette IP'
  }
});
app.use('/auth', limiter); // Applique le rate limiting uniquement aux routes d'authentification

// Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development', // Fallback pour local
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Erreur:`, err.stack);

  res.status(500).json({
    error: 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Une erreur est survenue',
    timestamp: timestamp // Ajout du timestamp pour le débogage
  });
});

const PORT = parseInt(process.env.PORT) || 5000; // Utilisation de parseInt et fallback
app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Serveur démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log('CORS est configuré pour autoriser toutes les origines.'); // Log l'origine manuelle
});