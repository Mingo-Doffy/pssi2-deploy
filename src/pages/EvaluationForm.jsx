import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container, Box, Typography, Button, Card,
  CardContent, CircularProgress, Alert, LinearProgress,
  Fab, Tooltip, RadioGroup, FormControlLabel, Radio, Grid
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpIcon from '@mui/icons-material/Help';

export default function EvaluationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
        
        // Charger les réponses sauvegardées
        const savedResponses = localStorage.getItem('evaluationResponses');
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
    localStorage.setItem('evaluationResponses', JSON.stringify(newResponses));
  };

  const handleSubmit = async () => {
    if (answeredQuestions !== totalQuestions) {
      setError("Veuillez répondre à toutes les questions avant de soumettre");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Calculer le score global sur 100
      let totalScore = 0;
      let maxScore = 0;
      
      const details = {};
      categories.forEach(category => {
        category.questions.forEach(question => {
          const responseValue = responses[question.id];
          const points = question.points[responseValue] || 0;
          details[`${category.id}_${question.id}`] = points;
          totalScore += points;
          maxScore += 10;
        });
      });

      const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      await api.post('/evaluations', { 
        score: parseFloat(score.toFixed(2)),
        details 
      });
      
      // Nettoyer le localStorage après soumission
      localStorage.removeItem('evaluationResponses');
      
      setSuccess("Évaluation soumise avec succès !");
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message || "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('evaluationResponses');
    const resetResponses = {};
    categories.forEach(category => {
      category.questions.forEach(question => {
        resetResponses[question.id] = '';
      });
    });
    setResponses(resetResponses);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          <SecurityIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Évaluation de Sécurité
        </Typography>
        <Typography color="text.secondary" paragraph>
          Veuillez évaluer la sécurité de votre entreprise sur les différents aspects ci-dessous.
        </Typography>

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

        <Card>
          <CardContent>
            {categories.length > 0 ? (
              <>
                {categories.map((category) => (
                  <Box key={category.id} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                      {category.name}
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {category.questions.map((question) => (
                        <Grid item xs={12} key={question.id}>
                          <Box sx={{ mb: 3 }}>
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
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || answeredQuestions !== totalQuestions}
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Envoi en cours...' : 'Soumettre l\'évaluation'}
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
          </CardContent>
        </Card>
      </Box>

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
              3. Utilisez le bouton "Réinitialiser" pour effacer toutes vos réponses
            </Typography>
            <Typography>
              4. Le score final sera calculé sur 100 points
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
    </Container>
  );
}