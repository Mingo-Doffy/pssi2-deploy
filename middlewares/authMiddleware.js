const db = require('../config/db');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'AUTH_REQUIRED',
        message: 'Authentification requise' 
      });
    }

    const decoded = db.jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.queryOne(
      `SELECT utilisateur_id, role, entite_id
       FROM utilisateur 
       WHERE utilisateur_id = ?`,
      [decoded.utilisateur_id]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'INVALID_TOKEN',
        message: 'Token invalide' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(401).json({ 
      error: 'INVALID_TOKEN',
      message: error.name === 'TokenExpiredError' 
        ? 'Token expiré' 
        : 'Token invalide'
    });
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'Accès non autorisé' 
      });
    }
    next();
  };
};