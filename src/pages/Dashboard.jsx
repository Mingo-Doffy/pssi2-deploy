import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Box, Typography, Container, Card, CardContent, Grid, Button,
  Tabs, Tab, Divider, CircularProgress, Alert
} from '@mui/material';
import {
  Business as BusinessIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Compare as CompareIcon,
  Person as PersonIcon,
  Description as DocumentationIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import DescriptionIcon from '@mui/icons-material/Description';
import ProfileTab from '../components/Dashboard/ProfileTab';
import SecurityTest from '../components/Dashboard/SecurityTest';
import HistoryTab from '../components/Dashboard/HistoryTab';
import ComparisonTab from '../components/Dashboard/ComparisonTab';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [subTabValue, setSubTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entites, setEntites] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const entitesResponse = await api.get('/entites');
        
        //if (!entitesResponse.data || entitesResponse.data.length === 0) {
        //  setError("Aucune entité trouvée dans le système");
        //  return;
        //}

        setEntites(entitesResponse.data);

        if (user?.entite_id) {
          await api.get(`/evaluations?entite_id=${user.entite_id}`);
        }
        
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setError(err.message || "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    if (user) loadData();
  }, [user]);

  const compareWithSector = async () => {
    if (!selectedSector || !user?.entite_id) {
      setError("Veuillez sélectionner un secteur valide");
      return;
    }
  
    setLoading(true);
    setError('');
    setComparison(null);
  
    try {
      const response = await api.get('/evaluations/compare-sector', {
        params: {
          entiteId: user.entite_id,
          secteur: selectedSector
        }
      });
  
      if (!response.data) {
        throw new Error("Aucune donnée reçue du serveur");
      }
  
      const transformedData = {
        currentEntite: {
          id: response.data.currentEntite?.id,
          name: response.data.currentEntite?.name || "Votre entité",
          data: response.data.currentEntite?.data || {},
          latestScore: response.data.currentEntite?.latestScore || 0,
          latestDate: response.data.currentEntite?.latestDate || new Date().toISOString()
        },
        comparedSector: {
          name: selectedSector,
          data: response.data.comparedSector?.data || {},
          averageScore: response.data.comparedSector?.averageScore || 0
        }
      };
  
      setComparison(transformedData);
  
    } catch (err) {
      console.error("Erreur de comparaison:", err);
      setError(err.message || "Erreur lors de la comparaison");
      setComparison({
        error: err.message || "Erreur lors de la comparaison"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue !== 1) {
      setSubTabValue(0);
      localStorage.removeItem('dashboardSubTab');
    }
  };

  const handleSubTabChange = (event, newValue) => {
    setSubTabValue(newValue);
    localStorage.setItem('dashboardSubTab', newValue.toString());
  };

  useEffect(() => {
    const storedSubTab = localStorage.getItem('dashboardSubTab');
    if (tabValue === 1 && storedSubTab) {
      setSubTabValue(parseInt(storedSubTab, 10));
    }
  }, [tabValue]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              <BusinessIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Tableau de bord - {user?.entite_nom || 'Mon Tableau de Bord'}
            </Typography>
            <Typography color="text.secondary">
              Type: {user?.secteur || 'Non spécifié'} | Rôle: {user?.role || 'Non spécifié'}
            </Typography>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={logout}>
              Déconnexion
            </Button>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Card>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Profil" icon={<PersonIcon />} />
            <Tab label="Évaluation" icon={<AssessmentIcon />} />
            <Tab label="Mediathèque" icon={<DocumentationIcon />} />
            <Tab 
              label="Signaler" 
              icon={<ReportIcon />} 
              component={Link} 
              to="https://signalement.cicert.ci/" 
            />
          </Tabs>
          
          <Divider />
          
          <TabPanel value={tabValue} index={0}>
            <ProfileTab user={user} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={subTabValue} 
                onChange={handleSubTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Test de sécurité" icon={<SecurityIcon />} />
                <Tab label="Historique" icon={<HistoryIcon />} />
                <Tab label="Comparaison(ALPHA)" icon={<CompareIcon />} />
              </Tabs>
            </Box>
            
            <TabPanel value={subTabValue} index={0}>
              <SecurityTest />
            </TabPanel>
            
            <TabPanel value={subTabValue} index={1}>
              <HistoryTab />
            </TabPanel>
            
            <TabPanel value={subTabValue} index={2}>
              <ComparisonTab 
                entites={entites} 
                selectedSector={selectedSector}
                setSelectedSector={setSelectedSector}
                comparison={comparison}
                compareWithSector={compareWithSector}
                loading={loading}
                user={user}
              />
            </TabPanel>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
      <DescriptionIcon color="primary" sx={{ verticalAlign: 'middle', mr: 2 }} />
      Médiathèque du CI-CERT
    </Typography>
    
    <Grid container spacing={3}>
      {/* Documentation Juridique */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Documentation Juridique
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Textes législatifs et réglementaires relatifs à la cybersécurité
            </Typography>
            <Button
              variant="contained"
              fullWidth
              component="a"
              href="https://www.cicert.ci/mediatheque/documentation-juridique/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              Accéder
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Guides et Bonnes Pratiques */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Guides et Bonnes Pratiques
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ressources pour améliorer votre posture de sécurité
            </Typography>
            <Button
              variant="contained"
              fullWidth
              component="a"
              href="https://www.cicert.ci/mediatheque/guides-et-bonnes-pratiques/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              Accéder
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Alertes et Avis */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alertes et Avis
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Dernières alertes de sécurité publiées par le CI-CERT
            </Typography>
            <Button
              variant="contained"
              fullWidth
              component="a"
              href="https://www.cicert.ci/mediatheque/alertes-et-avis/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              Accéder
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Publications */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Publications
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Rapports et études sur la cybersécurité en Côte d'Ivoire
            </Typography>
            <Button
              variant="contained"
              fullWidth
              component="a"
              href="https://www.cicert.ci/mediatheque/publications/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              Accéder
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Button
        variant="outlined"
        size="large"
        component="a"
        href="https://www.cicert.ci/mediatheque/"
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<DescriptionIcon />}
      >
        Voir toute la médiathèque
      </Button>
    </Box>
  </Box>
</TabPanel>
        </Card>
      </Box>
    </Container>
  );
}