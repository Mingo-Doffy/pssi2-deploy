const db = require('../config/db');
const questionsData = require('../questions/questions.json');
const evaluationCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

exports.createEvaluation = async (req, res) => {
  try {
    const { entite_id, utilisateur_id } = req.user;
    const { details } = req.body;

    const score = req.body.score || 
      (Object.values(details).reduce((sum, val) => sum + val, 0) / Object.values(details).length);

    await db.pool.execute(
      `INSERT INTO evaluation 
       (entite_id, utilisateur_id, score, details) 
       VALUES (?, ?, ?, ?)`,
      [entite_id, utilisateur_id, score, JSON.stringify(details)]
    );
    
    evaluationCache.delete(`evaluations_${entite_id}`);
    evaluationCache.delete(`stats_${entite_id}`);
    
    res.status(201).json({ 
      success: true,
      message: "Évaluation enregistrée",
      score: parseFloat(score.toFixed(2))
    });
  } catch (error) {
    console.error("Erreur création évaluation:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};

exports.getLatestEvaluation = async (req, res) => {
  try {
    const evaluation = await db.queryOne(
      `SELECT e.*, u.nom as evaluateur
       FROM evaluation e
       JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
       WHERE e.entite_id = ?
       ORDER BY e.date_evaluation DESC LIMIT 1`,
      [req.params.entiteId]
    );

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'NO_EVALUATION',
        message: "Aucune évaluation trouvée pour cette entité"
      });
    }

    res.json({
      success: true,
      ...evaluation,
      details: JSON.parse(evaluation.details)
    });
  } catch (error) {
    console.error("Erreur récupération évaluation:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};

exports.getEvaluations = async (req, res) => {
  const { entite_id } = req.user;
  const cacheKey = `evaluations_${entite_id}`;

  try {
    if (evaluationCache.has(cacheKey)) {
      return res.json({ 
        success: true, 
        evaluations: evaluationCache.get(cacheKey),
        cached: true
      });
    }

    const evaluations = await db.query(
      `SELECT e.*, u.nom as evaluateur 
       FROM evaluation e
       JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
       WHERE e.entite_id = ?
       ORDER BY e.date_evaluation DESC`,
      [entite_id]
    );
    
    evaluationCache.set(cacheKey, evaluations);
    setTimeout(() => evaluationCache.delete(cacheKey), 300000);
    
    res.json({ 
      success: true, 
      evaluations 
    });
  } catch (error) {
    console.error("Erreur récupération évaluations:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};

exports.compareEvaluations = async (req, res) => {
  const { entite_id: entite1 } = req.user;
  const { id: entite2 } = req.params;

  if (entite1 === entite2) {
    return res.status(400).json({
      success: false,
      error: 'SAME_ENTITY',
      message: "Impossible de comparer une entité avec elle-même"
    });
  }

  try {
    const [entite, eval1, eval2] = await Promise.all([
      db.queryOne('SELECT nom, secteur FROM entite WHERE entite_id = ?', [entite2]),
      db.queryOne(
        `SELECT details FROM evaluation 
         WHERE entite_id = ? 
         ORDER BY date_evaluation DESC LIMIT 1`,
        [entite1]
      ),
      db.queryOne(
        `SELECT details FROM evaluation 
         WHERE entite_id = ? 
         ORDER BY date_evaluation DESC LIMIT 1`,
        [entite2]
      )
    ]);

    if (!entite) {
      return res.status(404).json({ 
        success: false,
        error: 'ENTITY_NOT_FOUND',
        message: "Entité non trouvée" 
      });
    }

    if (!eval1 || !eval2) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_EVALUATIONS',
        message: "Les deux entités doivent avoir au moins une évaluation"
      });
    }
    
    res.json({
      success: true,
      data: {
        entite1: {
          id: entite1,
          name: req.user.entite_nom,
          data: eval1.details
        },
        entite2: {
          id: entite2,
          name: entite.nom,
          data: eval2.details
        },
        categories: Object.keys(eval1.details)
      }
    });
  } catch (error) {
    console.error("Erreur comparaison:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};

exports.compareSectorEvaluations = async (req, res) => {
  console.log('Début de compareSectorEvaluations'); // Ajout de log
  try {
    const { entiteId, secteur } = req.query;
    console.log(`entiteId: ${entiteId}, secteur: ${secteur}`); // Ajout de log

    if (!entiteId || !secteur) {
      console.log('Erreur: Paramètres manquants'); // Ajout de log
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMS',
        message: "L'ID de l'entité et le secteur sont requis"
      });
    }

    // 1. Récupérer les données de l'entité courante (la dernière évaluation)
    const [currentEntiteEvals] = await db.query(
      `SELECT e.details, e.score, e.date_evaluation, ent.nom as entite_nom
       FROM evaluation e
       JOIN entite ent ON e.entite_id = ent.entite_id
       WHERE e.entite_id = ?
       ORDER BY e.date_evaluation DESC LIMIT 1`,
      [entiteId]
    );
    const currentEntite = currentEntiteEvals ? currentEntiteEvals[0] : null;

    if (!currentEntite) {
      return res.status(404).json({
        success: false,
        error: 'NO_ENTITY_DATA',
        message: "Aucune donnée d'évaluation trouvée pour cette entité"
      });
    }

    // 2. Récupérer les évaluations du secteur (en excluant l'entité courante)
    const [sectorEvalsResult] = await db.query(
      `SELECT e.details, e.score
       FROM evaluation e
       JOIN entite ent ON e.entite_id = ent.entite_id
       WHERE ent.secteur = ? AND e.entite_id != ?`,
      [secteur, entiteId]
    );

console.log('Résultat de db.query pour sectorEvalsResult:', sectorEvalsResult); // Ajout de log


    const sectorEvals = sectorEvalsResult || [];

    // 3. Calculer les moyennes du secteur
    const domainKeys = [
      'leadership_gouvernance',
      'organisation_securite',
      'gestion_risques',
      'securite_rh',
      'gestion_actifs',
      'gestion_acces'
    ];

    const sectorStats = {
      totalScore: 0,
      count: 0,
      domains: domainKeys.reduce((acc, domain) => {
        acc[domain] = { total: 0, count: 0 };
        return acc;
      }, {})
    };

    sectorEvals.forEach(eval => {
      try {
        const details = safeParseJson(eval.details);

        // Calculer les moyennes par domaine
        domainKeys.forEach(domain => {
          const domainPrefix = `${domain}_q`;
          let domainScore = 0;
          let questionCount = 0;

          Object.entries(details).forEach(([key, value]) => {
            if (key.startsWith(domainPrefix)) {
              domainScore += value?.points || 0;
              questionCount++;
            }
          });

          if (questionCount > 0) {
            sectorStats.domains[domain].total += (domainScore / questionCount);
            sectorStats.domains[domain].count++;
          }
        });

        // Ajouter au score total
        if (eval.score) {
          sectorStats.totalScore += parseFloat(eval.score);
          sectorStats.count++;
        }
      } catch (e) {
        console.error("Erreur lors du traitement d'une évaluation du secteur:", e);
      }
    });

    // 4. Préparer les moyennes du secteur pour la réponse
    const sectorAverages = {};
    domainKeys.forEach(domain => {
      const avg = sectorStats.domains[domain].count > 0
        ? sectorStats.domains[domain].total / sectorStats.domains[domain].count
        : 0;
      sectorAverages[domain] = Math.round(avg * 10) / 10; // Arrondir à 1 décimale
    });

    const sectorAvgScore = sectorStats.count > 0
      ? Math.round((sectorStats.totalScore / sectorStats.count) * 10) / 10
      : 0;

    // 5. Préparer les données de l'entité courante pour la comparaison
    const currentEntiteDetails = safeParseJson(currentEntite?.details);
    const currentEntiteDomainScores = {};
    domainKeys.forEach(domain => {
      const domainPrefix = `${domain}_q`;
      let domainScore = 0;
      let questionCount = 0;
      Object.entries(currentEntiteDetails).forEach(([key, value]) => {
        if (key.startsWith(domainPrefix)) {
          domainScore += value?.points || 0;
          questionCount++;
        }
      });
      currentEntiteDomainScores[domain] = questionCount > 0 ? Math.round((domainScore / questionCount) * 10) / 10 : 0;
    });

    // 6. Construction de la réponse
    const responseData = {
      currentEntite: {
        id: entiteId,
        name: currentEntite?.entite_nom,
        latestScore: parseFloat(currentEntite?.score || 0).toFixed(2),
        latestDate: currentEntite?.date_evaluation,
        data: currentEntiteDomainScores
      },
      comparedSector: {
        name: secteur,
        evaluationCount: sectorStats.count,
        averageScore: isNaN(sectorAvgScore) ? 0 : sectorAvgScore,
        data: sectorAverages
      }
    };

    console.log('Réponse JSON envoyée:', responseData); // Ajout de log
    res.json({ success: true, data: responseData });

  } catch (error) {
    console.error("Erreur dans compareSectorEvaluations:", error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur lors de la comparaison avec le secteur",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log('Fin de compareSectorEvaluations'); // Ajout de log
  }
};

// Helper function for safe JSON parsing
function safeParseJson(data) {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return {};
  }
}

exports.getEvaluationHistory = async (req, res) => {
  try {
    const { entite_id } = req.user;
    
    const evaluations = await db.query(
      `SELECT e.*, u.nom as evaluateur 
       FROM evaluation e
       JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
       WHERE e.entite_id = ?
       ORDER BY e.date_evaluation DESC`,
      [entite_id]
    );

    // Convertir les détails JSON si nécessaire
    const formattedEvals = evaluations.map(eval => ({
      ...eval,
      details: typeof eval.details === 'string' ? JSON.parse(eval.details) : eval.details
    }));

    res.json({
      success: true,
      data: formattedEvals
    });
  } catch (error) {
    console.error("Erreur récupération historique:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};

exports.getEvaluationsStats = async (req, res) => {
  try {
    const { entite_id } = req.user;

    const stats = await db.queryOne(
      `SELECT 
        COUNT(*) as total,
        AVG(score) as moyenne,
        MIN(score) as minimum,
        MAX(score) as maximum,
        MIN(date_evaluation) as premiere,
        MAX(date_evaluation) as derniere
       FROM evaluation
       WHERE entite_id = ?`,
      [entite_id]
    );

    res.json({
      success: true,
      data: {
        nombre: stats.total,
        moyenne: parseFloat(stats.moyenne || 0).toFixed(2),
        minimum: parseFloat(stats.minimum || 0),
        maximum: parseFloat(stats.maximum || 0),
        premiere_evaluation: stats.premiere,
        derniere_evaluation: stats.derniere
      }
    });

  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function for safe JSON parsing
function safeParseJson(data) {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return {};
  }
}

// Helper to enrich evaluation details with question texts
function enrichDetails(details) {
  const enriched = {};
  Object.entries(details).forEach(([key, value]) => {
    const [domain, questionId] = key.split('_');
    const domainQuestions = questionsData.find(d => d.id === domain);
    if (domainQuestions) {
      const question = domainQuestions.questions.find(q => q.id === questionId);
      enriched[key] = {
        ...value,
        questionText: question?.text || 'Question non trouvée',
        maxPoints: 10
      };
    }
  });
  return enriched;
}

exports.getEvaluationHistoryDetails = async (req, res) => {
  try {
    const { entite_id } = req.user;

    if (!entite_id) {
      return res.status(400).json({
        success: false,
        message: "ID d'entité manquant dans le token"
      });
    }

    console.log(`Fetching evaluations for entite_id: ${entite_id}`);
    const evaluations = await db.query(
      `SELECT 
        e.evaluation_id, 
        e.date_evaluation, 
        e.score, 
        e.details,
        u.nom as evaluateur
       FROM evaluation e
       JOIN utilisateur u ON e.utilisateur_id = u.utilisateur_id
       WHERE e.entite_id = ?
       ORDER BY e.date_evaluation DESC`,
      [entite_id]
    );

    console.log(`Found ${evaluations.length} evaluations`);

    // Formatage robuste des données
    const formattedData = evaluations.map(eval => {
      try {
        return {
          evaluation_id: eval.evaluation_id,
          date_evaluation: eval.date_evaluation,
          score: parseFloat(eval.score) || 0,
          evaluateur: eval.evaluateur,
          details: typeof eval.details === 'string' 
            ? JSON.parse(eval.details) 
            : eval.details || {}
        };
      } catch (error) {
        console.error('Error formatting evaluation:', eval, error);
        return null;
      }
    }).filter(Boolean);

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });

  } catch (error) {
    console.error('Error in getEvaluationHistoryDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllEntites = async (req, res) => {
  try {
    const entites = await db.query(
      'SELECT entite_id, nom, secteur FROM entite ORDER BY nom'
    );
    res.json({ 
      success: true, 
      data: entites 
    });
  } catch (error) {
    console.error("Erreur récupération entités:", error);
    res.status(500).json({ 
      success: false,
      error: 'SERVER_ERROR',
      message: "Erreur serveur" 
    });
  }
};