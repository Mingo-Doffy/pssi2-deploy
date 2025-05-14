const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../questions/questions.json'), 'utf8')
);

exports.register = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role, entite_nom, secteur, taille } = req.body;

    if (!nom || !email || !mot_de_passe || !role || !entite_nom) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT',
        message: 'Tous les champs sont obligatoires' 
      });
    }

    const existingUser = await db.queryOne(
      'SELECT utilisateur_id FROM utilisateur WHERE email = ?', 
      [email]
    );
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'USER_EXISTS',
        message: 'Email déjà utilisé' 
      });
    }

    const [entite] = await db.pool.execute(
      'INSERT INTO entite (nom, secteur, taille) VALUES (?, ?, ?)',
      [entite_nom, secteur, taille]
    );

    const hashedPassword = await db.bcrypt.hash(mot_de_passe, 12);
    
    await db.pool.execute(
      'INSERT INTO utilisateur (nom, email, mot_de_passe, role, entite_id) VALUES (?, ?, ?, ?, ?)',
      [nom, email, hashedPassword, role, entite.insertId]
    );
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const user = await db.queryOne(
      `SELECT u.*, e.nom as entite_nom, e.secteur 
       FROM utilisateur u
       JOIN entite e ON u.entite_id = e.entite_id
       WHERE u.email = ?`,
      [email]
    );
    
    if (!user) {
      return res.status(401).json({ 
        error: 'INVALID_CREDENTIALS',
        message: 'Identifiants incorrects' 
      });
    }
    
    const isMatch = await db.bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'INVALID_CREDENTIALS',
        message: 'Identifiants incorrects' 
      });
    }
    
    const token = db.jwt.sign(
      { 
        utilisateur_id: user.utilisateur_id,
        role: user.role,
        entite_id: user.entite_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({ 
      success: true,
      token,
      user: {
        id: user.utilisateur_id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        entite_id: user.entite_id,
        entite_nom: user.entite_nom,
        secteur: user.secteur
      },
      questions
    });
  } catch (error) {
    console.error("Erreur connexion:", error);
    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};