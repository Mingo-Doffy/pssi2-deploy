import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Box, Typography, CircularProgress, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const DOMAIN_CONFIG = [
  { id: 'gouvernance_leadership', label: 'Gouvernance et Leadership', prefixes: ['gouvernance', 'leadership'] },
  { id: 'organisation_ssi', label: 'Organisation de la SSI', prefixes: ['organisation', 'ssi'] },
  { id: 'gestion_risques', label: 'Gestion des risques', prefixes: ['risques'] },
  { id: 'securite_ressources_humaines', label: 'Sécurité des ressources humaines', prefixes: ['ressources', 'humaines'] },
  { id: 'gestion_actifs', label: 'Gestion des actifs', prefixes: ['actifs'] },
  { id: 'controle_acces', label: 'Contrôle d\'accès', prefixes: ['acces'] },
  { id: 'cryptographie', label: 'Cryptographie', prefixes: ['cryptographie'] },
  { id: 'securite_physique', label: 'Sécurité physique et environnementale', prefixes: ['physique', 'environnementale'] },
  { id: 'exploitation_maintenance', label: 'Exploitation et maintenance', prefixes: ['exploitation', 'maintenance'] },
  { id: 'developpement_acquisition', label: 'Développement & acquisition', prefixes: ['developpement', 'acquisition'] },
  { id: 'relations_fournisseurs', label: 'Relations fournisseurs', prefixes: ['fournisseurs'] },
  { id: 'gestion_incidents', label: 'Gestion des incidents', prefixes: ['incidents'] },
  { id: 'continuite_activite', label: 'Continuité d\'activité', prefixes: ['continuite', 'activite'] },
  { id: 'conformite', label: 'Conformité', prefixes: ['conformite'] }
];
export default function HistoryTab() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/evaluations/history/details');
        setEvaluations(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const prepareRadarData = (evaluation) => {
    if (!evaluation?.details) return null;

    const domainData = DOMAIN_CONFIG.map(domain => {
      const domainEntries = Object.entries(evaluation.details)
        .filter(([key]) => 
          domain.prefixes.some(prefix => key.toLowerCase().includes(prefix))
        )
        .map(([key, value]) => ({
          questionId: key,
          points: value.points || 0,
          suggestion: value.suggestion
        }));

      const score = domainEntries.length > 0
        ? Math.round((domainEntries.reduce((sum, q) => sum + q.points, 0) / (domainEntries.length * 10) * 100))
        : 0;

      return {
        ...domain,
        score,
        suggestions: domainEntries.filter(q => q.suggestion)
      };
    });

    return {
      labels: DOMAIN_CONFIG.map(d => d.label),
      datasets: [{
        label: `Score: ${evaluation.score}%`,
        data: domainData.map(d => d.score),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      }],
      domainData // Nous gardons les données par domaine pour les suggestions
    };
  };

  const getSeverityIcon = (score) => {
    if (score < 5) return <ErrorIcon color="error" />;
    if (score < 8) return <WarningIcon color="warning" />;
    return <InfoIcon color="info" />;
  };

  // ... (radarOptions et gestion des états restent identiques)
  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent'
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`
        }
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Aucune évaluation disponible
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Historique des évaluations
      </Typography>

      {evaluations.map((evaluation, index) => {
        const chartData = prepareRadarData(evaluation);
        if (!chartData) return null;

        return (
          <Accordion key={index} sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ flexGrow: 1 }}>
                  Évaluation du {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}
                </Typography>
                <Chip 
                  label={`${evaluation.score}%`}
                  color={
                    evaluation.score >= 75 ? 'success' :
                    evaluation.score >= 50 ? 'warning' : 'error'
                  }
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 4, height: '400px' }}>
                <Radar data={chartData} options={radarOptions} />
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 2 }}>
                <WarningIcon color="warning" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Suggestions d'amélioration
              </Typography>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Domaine</TableCell>
                      <TableCell>Recommandation</TableCell>
                      <TableCell align="right">Priorité</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chartData.domainData
                      .filter(domain => domain.suggestions.length > 0)
                      .flatMap(domain =>
                        domain.suggestions.map((suggestion, i) => (
                          <TableRow key={`${domain.id}-${i}`}>
                            <TableCell>
                              {i === 0 ? domain.label : ''}
                            </TableCell>
                            <TableCell>
                              {suggestion.suggestion}
                            </TableCell>
                            <TableCell align="right">
                              {getSeverityIcon(suggestion.points)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}