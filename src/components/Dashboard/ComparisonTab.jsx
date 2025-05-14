import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import ComparisonRadar from './ComparisonRadar';

export default function ComparisonTab({ entites, user }) {
  const [selectedSector, setSelectedSector] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get unique sectors (excluding current user's sector)
  const sectors = [...new Set(entites
    .filter(e => e.secteur && e.secteur !== user?.secteur)
    .map(e => e.secteur)
  )];

  const handleCompare = async () => {
  setLoading(true);
  setError(null);
  setComparisonData(null);
  
  try {
    const response = await fetch(
      `/api/evaluations/compare-sector?entiteId=${user.entite_id}&secteur=${encodeURIComponent(selectedSector)}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    /*// Vérification du Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Réponse non-JSON reçue: ${text.substring(0, 100)}...`);
    }*/

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Erreur ${response.status}`);
    }

    // Validation approfondie de la structure
    if (!result?.success || !result.data) {
      throw new Error('Structure de réponse invalide');
    }

    if (!result.data.currentEntite || !result.data.comparedSector) {
      throw new Error('Données de comparaison incomplètes');
    }

    setComparisonData(result.data);
  } catch (err) {
    console.error("Erreur de comparaison:", err);
    setError(err.message || 'Une erreur est survenue lors de la comparaison');
    
    // Log supplémentaire pour le débogage
    try {
      const errorResponse = await response?.text();
      console.error("Réponse complète du serveur:", errorResponse);
    } catch (e) {
      console.error("Impossible de lire la réponse d'erreur", e);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid item xs={12} md={4}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Comparaison Sectorielle
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="sector-select-label">Secteur à comparer</InputLabel>
            <Select
              labelId="sector-select-label"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              label="Secteur à comparer"
              disabled={loading}
            >
              {sectors.map((sector, index) => (
                <MenuItem key={`sector-${index}`} value={sector}>
                  {sector}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleCompare}
            disabled={!selectedSector || loading}
            fullWidth
            size="large"
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Chargement...
              </>
            ) : (
              'Lancer la comparaison'
            )}
          </Button>

          {comparisonData && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2">Statistiques du secteur:</Typography>
              <Typography variant="body2">
                Nombre d'évaluations: {comparisonData.comparedSector.evaluationCount}
              </Typography>
              <Typography variant="body2">
                Score moyen: {comparisonData.comparedSector.averageScore}%
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        {loading && !comparisonData ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        ) : comparisonData ? (
          <ComparisonRadar data={comparisonData} />
        ) : (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {sectors.length > 0
                ? "Sélectionnez un secteur pour comparer les performances"
                : "Aucun autre secteur disponible pour comparaison"}
            </Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
}


