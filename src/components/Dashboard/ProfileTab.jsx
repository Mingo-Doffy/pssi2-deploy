import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Box, Typography, Grid, Card, CardContent,
  Avatar, List, ListItem, ListItemText,
  CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfileTab({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/evaluations/history');
        setHistory(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Erreur lors du chargement de l'historique");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Calcul des stats à partir de l'historique
  const stats = {
    total_evaluations: history.length,
    average_score: history.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / (history.length || 1),
    first_evaluation: history.length > 0 ? history[history.length - 1].date_evaluation : null,
    last_evaluation: history.length > 0 ? history[0].date_evaluation : null
  };

  // Préparation des données pour le graphique
  const chartData = [
    { date: "Début", score: 0 }, // Point de départ
    ...history
      .sort((a, b) => new Date(a.date_evaluation) - new Date(b.date_evaluation))
      .map(evaluation => ({
        date: new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR'),
        score: evaluation.score || 0
      }))
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              width: 100, 
              height: 100, 
              mb: 2,
              fontSize: 40,
              mx: 'auto',
              bgcolor: 'primary.main'
            }}>
              {user?.nom?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user?.nom || 'Utilisateur'}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            
            <List sx={{ mt: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="Entité" 
                  secondary={user?.entite_nom || 'Non spécifié'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Secteur" 
                  secondary={user?.secteur || 'Non spécifié'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Rôle" 
                  secondary={user?.role || 'Non spécifié'} 
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistiques des évaluations
            </Typography>
            
            {/* Tableau récapitulatif */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Métrique</TableCell>
                    <TableCell align="right">Valeur</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center">
                        <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                        Nombre total d'évaluations
                      </Box>
                    </TableCell>
                    <TableCell align="right">{stats.total_evaluations}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center">
                        <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                        Score moyen
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {stats.average_score.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center">
                        <HistoryIcon color="primary" sx={{ mr: 1 }} />
                        Première évaluation
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatDate(stats.first_evaluation)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center">
                        <UpdateIcon color="primary" sx={{ mr: 1 }} />
                        Dernière évaluation
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatDate(stats.last_evaluation)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" gutterBottom>
              Évolution des scores
            </Typography>
            
            {chartData.length > 1 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => label === 'Début' ? 'Point de départ' : `Évaluation: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3f51b5" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="text.secondary" align="center" py={4}>
                Aucune donnée d'évolution disponible
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}