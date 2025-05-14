import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  CircularProgress, Alert, Accordion, AccordionSummary,
  AccordionDetails, Fab, Tooltip, LinearProgress,
  RadioGroup, FormControlLabel, Radio, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpIcon from '@mui/icons-material/Help';
import api from '../../services/api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ComparisonRadar from './ComparisonRadar';

export default function SecurityTest() {
  const [categories, setCategories] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [details, setDetails] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);

  // Calcul du progrès
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(responses).filter(k => responses[k] !== '').length;
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get('/questions');
        setCategories(response.data);
        
        // Charger les dernières réponses si elles existent
        const savedResponses = localStorage.getItem('securityTestResponses');
        const initialResponses = savedResponses ? JSON.parse(savedResponses) : {};
        
        // Initialiser les réponses manquantes
        response.data.forEach(category => {
          category.questions.forEach(question => {
            if (!initialResponses[question.id]) {
              initialResponses[question.id] = '';
            }
          });
        });
        
        setResponses(initialResponses);
      } catch (err) {
        setError("Erreur lors du chargement des questions");
      }
    };

    fetchQuestions();
  }, []);

  const handleResponseChange = (questionId, value) => {
    const newResponses = {
      ...responses,
      [questionId]: value
    };
    setResponses(newResponses);
    localStorage.setItem('securityTestResponses', JSON.stringify(newResponses));
  };

  const calculateResults = () => {
    let totalScore = 0;
    let maxScore = 0;
    const resultDetails = {};
    
    categories.forEach(category => {
      category.questions.forEach(question => {
        const responseValue = responses[question.id];
        if (responseValue) {
          const points = question.points[responseValue] || 0;
          resultDetails[`${category.id}_${question.id}`] = {
            points,
            suggestion: question.suggestion?.[responseValue],
            maxPoints: 10
          };
          totalScore += points;
          maxScore += 10;
        }
      });
    });

    const calculatedScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    return { score: parseFloat(calculatedScore.toFixed(2)), details: resultDetails };
  };

  const handleSubmit = async () => {
    const { score: calculatedScore, details: calculatedDetails } = calculateResults();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/evaluations', { 
        score: calculatedScore,
        details: calculatedDetails 
      });
      
      setScore(calculatedScore);
      setDetails(calculatedDetails);
      setShowResults(true);
      setSuccess("Évaluation soumise avec succès !");
    } catch (err) {
      setError(err.message || "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    localStorage.removeItem('securityTestResponses');
    const resetResponses = {};
    categories.forEach(category => {
      category.questions.forEach(question => {
        resetResponses[question.id] = '';
      });
    });
    setResponses(resetResponses);
    setShowResults(false);
    setSuccess('');
    setError('');
  };

  // Préparer les données pour le radar
  const radarData = showResults ? {
    categories: categories.map(cat => cat.name),
    entite1: {
      name: "Votre score",
      data: categories.map(category => {
        const categoryQuestions = category.questions.map(q => 
          details[`${category.id}_${q.id}`]?.points || 0
        );
        const avg = categoryQuestions.reduce((a, b) => a + b, 0) / categoryQuestions.length;
        return (avg / 10) * 100; // Convertir en pourcentage
      })
    }
  } : null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Test de Sécurité
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Progression: {answeredQuestions}/{totalQuestions} questions ({progress}%)
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      <Card>
        <CardContent>
          {!showResults ? (
            <>
              {categories.length > 0 ? (
                <>
                  {categories.map((category) => (
                    <Accordion key={category.id} defaultExpanded sx={{ mb: 3 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">{category.name}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {category.questions.map((question) => (
                          <Box key={question.id} sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                              {question.text}
                            </Typography>
                            
                            <RadioGroup
                              value={responses[question.id] || ''}
                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                              row
                              sx={{ gap: 2 }}
                            >
                              {question.options.map((option) => (
                                <FormControlLabel
                                  key={option}
                                  value={option}
                                  control={<Radio />}
                                  label={option}
                                  sx={{
                                    border: responses[question.id] === option 
                                      ? '2px solid #1976d2' 
                                      : '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1,
                                    m: 0
                                  }}
                                />
                              ))}
                            </RadioGroup>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading || answeredQuestions !== totalQuestions}
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Envoi en cours...' : 'Soumettre le test'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Chargement des questions...
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Résultats de votre évaluation
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mb: 4 }}>
                Score global: {score}/100
              </Typography>

              {radarData && (
                <Box sx={{ mb: 4 }}>
                  <ComparisonRadar data={{
                    categories: radarData.categories,
                    entite1: radarData.entite1,
                    entite2: null
                  }} />
                </Box>
              )}

              {categories.map((category) => (
                <Box key={category.id} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {category.name}
                  </Typography>
                  
                  {category.questions.map((question) => {
                    const resultKey = `${category.id}_${question.id}`;
                    const result = details[resultKey];
                    
                    return (
                      <Box key={question.id} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {question.text}
                        </Typography>
                        
                        <Typography sx={{ mb: 1 }}>
                          <strong>Votre réponse:</strong> {responses[question.id]}
                        </Typography>
                        
                        <Typography sx={{ mb: 1 }}>
                          <strong>Points obtenus:</strong> {result?.points || 0}/10
                        </Typography>
                        
                        {result?.suggestion && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <strong>Suggestion:</strong> {result.suggestion}
                          </Alert>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleRestart}
                  sx={{ mr: 2 }}
                >
                  Nouvelle évaluation
                </Button>
                <Button
                  variant="contained"
                  onClick={() => window.print()}
                >
                  Imprimer les résultats
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Bouton d'aide flottant */}
      <Tooltip 
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" gutterBottom>Guide d'utilisation</Typography>
            <Typography paragraph>
              1. Sélectionnez une réponse pour chaque question (affichées en ligne)
            </Typography>
            <Typography paragraph>
              2. La barre de progression se met à jour automatiquement
            </Typography>
            <Typography paragraph>
              3. Vos réponses sont sauvegardées jusqu'à soumission ou réinitialisation
            </Typography>
            <Typography>
              4. Après soumission, consultez votre score sur 100 et le radar de performance
            </Typography>
          </Box>
        } 
        arrow
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        placement="left"
      >
        <Fab 
          color="primary" 
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setHelpOpen(!helpOpen)}
        >
          <HelpIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}