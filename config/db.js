const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  // Ajoute cette option pour désactiver la vérification stricte du certificat
  ssl: {
    rejectUnauthorized: false
  }
});

// Tentative de connexion initiale pour vérifier la base de données
pool.getConnection()
  .then(connection => {
    console.log('Connexion à la base de données MySQL réussie !');
    connection.release(); // Libérer la connexion après la vérification
  })
  .catch(err => {
    console.error('Erreur lors de la connexion à la base de données MySQL :', err);
    // Il serait judicieux d'arrêter l'application ici en cas d'échec critique de la connexion
    // process.exit(1);
  });

module.exports = {
  pool,
  bcrypt,
  jwt,

  // Méthode query optimisée
  query: async (sql, params, transaction = false) => {
    let conn;
    try {
      conn = transaction ? await pool.getConnection() : pool;
      const [rows] = await conn.execute(sql, params);
      return rows;
    } finally {
      if (transaction && conn) conn.release();
    }
  },

  // Méthode queryOne optimisée
  queryOne: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  // Gestion des transactions
  transaction: async (callback) => {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};