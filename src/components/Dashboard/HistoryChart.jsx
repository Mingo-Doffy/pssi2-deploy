import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, CircularProgress, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip, Grid,
  Button, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import api from '../../services/api';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const getColorByScore = (score) => {
  if (score >= 75) return { bg: 'rgba(56, 142, 60, 0.2)', border: '#388e3c' };
  if (score >= 50) return { bg: 'rgba(255, 152, 0, 0.2)', border: '#ff9800' };
  return { bg: 'rgba(244, 67, 54, 0.2)', border: '#f44336' };
};

const DOMAIN_CONFIG = {
  gouvernance_leadership: { label: "Gouvernance et Leadership" },
  organisation_ssi: { label: "Organisation de la SSI" },
  gestion_risques: { label: "Gestion des risques" },
  securite_ressources_humaines: { label: "Sécurité des ressources humaines" },
  gestion_actifs: { label: "Gestion des actifs" },
  controle_acces: { label: "Contrôle d'accès" },
  cryptographie: { label: "Cryptographie" },
  securite_physique: { label: "Sécurité physique et environnementale" },
  exploitation_maintenance: { label: "Exploitation et maintenance" },
  developpement_acquisition: { label: "Développement & acquisition" },
  relations_fournisseurs: { label: "Relations fournisseurs" },
  gestion_incidents: { label: "Gestion des incidents" },
  continuite_activite: { label: "Continuité d'activité" },
  conformite: { label: "Conformité" }
};

const HistoryChart = () => {
  const [state, setState] = useState({
    evaluations: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchEvaluations = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.get('/evaluations/history/details');
      
      if (!response?.success) {
        throw new Error(response?.message || 'Réponse serveur invalide');
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Format de données incorrect');
      }

      setState({
        evaluations: response.data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Erreur API:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors du chargement des données'
      }));
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const prepareChartData = (evaluation) => {
    if (!evaluation?.details) return null;

    const domainResults = Object.keys(DOMAIN_CONFIG).map(domainId => {
      const domainQuestions = Object.entries(evaluation.details)
        .filter(([key]) => key.startsWith(domainId))
        .map(([, value]) => value);

      const totalPoints = domainQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
      const maxPoints = domainQuestions.length * 10;
      const percentage = domainQuestions.length > 0 ? (totalPoints / maxPoints) * 100 : 0;
      const colors = getColorByScore(percentage);

      const suggestions = domainQuestions
        .filter(q => q.suggestion && q.suggestion.trim() !== '')
        .map(q => ({
          text: q.suggestion,
          severity: q.points < 5 ? 'high' : q.points < 8 ? 'medium' : 'low'
        }));

      return {
        domainId,
        label: DOMAIN_CONFIG[domainId].label,
        percentage,
        suggestions,
        hasData: domainQuestions.length > 0,
        color: colors,
        questionCount: domainQuestions.length
      };
    });

    return {
      labels: domainResults.map(d => d.label),
      datasets: [{
        label: `Score global: ${evaluation.score?.toFixed(1) || 0}%`,
        data: domainResults.map(d => d.percentage),
        backgroundColor: domainResults.map(d => d.color.bg),
        borderColor: domainResults.map(d => d.color.border),
        borderWidth: 2.5,
        pointBackgroundColor: domainResults.map(d => d.hasData ? d.color.border : 'rgba(200, 200, 200, 0.5)'),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#3f51b5',
        pointHoverBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 8,
        domainDetails: domainResults
      }]
    };
  };

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.12)',
          lineWidth: 1.2
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'rgba(255, 255, 255, 0.95)',
          backdropPadding: 8,
          font: {
            size: 11,
            weight: 'bold'
          },
          z: 10,
          showLabelBackdrop: false,
          color: '#424242'
        },
        grid: {
          circular: true,
          color: (context) => {
            return context.tick.value % 40 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)';
          },
          lineWidth: (context) => {
            return context.tick.value % 40 === 0 ? 1.8 : 1;
          }
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold',
            family: "'Roboto', sans-serif"
          },
          color: '#424242',
          padding: 18,
          backdropColor: 'rgba(255, 255, 255, 0.85)',
          backdropPadding: {x: 10, y: 6},
          borderRadius: 5
        },
        startAngle: 30
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 14,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const domainDetails = context.dataset.domainDetails;
            const hasData = domainDetails[context.dataIndex].hasData;
            return [`${context.label}`, hasData ? `Score: ${context.raw.toFixed(1)}%` : 'Non évalué'];
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0,
        borderWidth: 2.8,
        fill: true
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        hitRadius: 12
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  }), []);

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'high': return <ErrorIcon color="error" fontSize="small" />;
      case 'medium': return <WarningIcon color="warning" fontSize="small" />;
      default: return <InfoIcon color="info" fontSize="small" />;
    }
  };

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box my={4} textAlign="center">
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
          {state.error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchEvaluations}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  if (state.evaluations.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 4, maxWidth: 600, mx: 'auto' }}>
        Aucune évaluation disponible pour le moment
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ 
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 'bold'
        }}>
          Analyse de Sécurité par Domaine
        </Typography>
        {state.lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Dernière mise à jour : {state.lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {state.evaluations.map((evaluation) => {
        const chartData = prepareChartData(evaluation);
        if (!chartData) return null;

        return (
          <Accordion 
            key={evaluation.evaluation_id} 
            sx={{ 
              mb: 3, 
              boxShadow: 3,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
              }}
            >
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                  Évaluation du {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}
                </Typography>
                <Chip
                  label={`${evaluation.score?.toFixed(1) || 0}%`}
                  sx={{ 
                    mr: 2, 
                    fontWeight: 'bold',
                    bgcolor: getColorByScore(evaluation.score).border,
                    color: 'white'
                  }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Grid container spacing={0}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ 
                    height: { xs: 350, md: 450 },
                    position: 'relative',
                    p: 3,
                    borderRight: { md: '1px solid rgba(0, 0, 0, 0.12)' }
                  }}>
                    <Radar
                      data={chartData}
                      options={chartOptions}
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 16, 
                      right: 16,
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'background.paper',
                      p: 1,
                      borderRadius: 1,
                      boxShadow: 1
                    }}>
                      <SecurityIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="caption">
                        Score global: {evaluation.score?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ 
                    height: { md: 450 },
                    overflow: 'auto',
                    p: 3
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      mb: 2,
                      pb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                    }}>
                      <WarningIcon color="warning" sx={{ mr: 1 }} />
                      Recommandations
                    </Typography>
                    {chartData.datasets[0].domainDetails.some(d => d.suggestions.length > 0) ? (
                      <List dense sx={{ py: 0 }}>
                        {chartData.datasets[0].domainDetails.map((domain, i) => (
                          domain.suggestions.length > 0 && (
                            <React.Fragment key={i}>
                              <ListItem sx={{ 
                                pl: 0,
                                py: 1.5,
                                bgcolor: 'rgba(0, 0, 0, 0.03)',
                                borderRadius: 1,
                                mt: i > 0 ? 1 : 0
                              }}>
                                <ListItemText
                                  primary={
                                    <Typography 
                                      variant="subtitle2" 
                                      sx={{ 
                                        color: domain.color.border,
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Box 
                                        component="span" 
                                        sx={{
                                          display: 'inline-block',
                                          width: 14,
                                          height: 14,
                                          bgcolor: domain.color.border,
                                          borderRadius: '50%',
                                          mr: 1.5
                                        }}
                                      />
                                      {domain.label} ({domain.percentage.toFixed(0)}%)
                                    </Typography>
                                  }
                                />
                              </ListItem>
                              {domain.suggestions.map((suggestion, j) => (
                                <ListItem 
                                  key={j} 
                                  sx={{ 
                                    pl: 3, 
                                    py: 1,
                                    borderLeft: `3px solid ${domain.color.border}`
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    {getSeverityIcon(suggestion.severity)}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2">
                                        {suggestion.text}
                                      </Typography>
                                    }
                                    sx={{ my: 0 }}
                                  />
                                </ListItem>
                              ))}
                            </React.Fragment>
                          )
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        py: 4,
                        color: 'text.secondary'
                      }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                          Aucune recommandation critique pour cette évaluation
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default HistoryChart;