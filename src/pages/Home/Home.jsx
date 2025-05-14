import React from 'react';
import { Box, Container, Typography, Button, Grid, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const services = [
    {
      title: "CI-CERT",
      description: "Signaler un incident de sécurité. Déclarer une vulnérabilité."
    },
    {
      title: "PKI",
      description: "Signature électronique. Signer numériquement les documents. Signaler un dysfonctionnement."
    },
    {
      title: "SOC",
      description: "Accéder au service de surveillance."
    },
    {
      title: "PLCC",
      description: "Déposer une plainte d'escroquerie."
    },
    {
      title: "CLI",
      description: "Signaler une propagande."
    },
    {
      title: "Réseau RSSI DSI",
      description: "Évaluation complète du degré de conformité à la PSSI des administrations publiques."
    },
    {
      title: "Formation",
      description: "Demander une formation."
    },
    {
      title: "Audit SSI",
      description: "Demander une qualification PASSI. Demander un audit SSI."
    }
  ];

  const eligibleEntities = [
    "EPA (Établissements Publics Administratifs)",
    "EPIC (Établissements Publics Industriels et Commerciaux)",
    "Centres Hospitaliers",
    "Entreprises Publiques",
    "Ministères",
    "Collectivités Territoriales",
    "Organismes Assimilés"
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <Container component="main" maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Hero Section */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ 
              p: 4, 
              textAlign: 'center',
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
                : 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
              color: theme.palette.mode === 'light' ? 'text.primary' : 'common.white'
            }}>
              <Typography variant={isMobile ? "h4" : "h3"} gutterBottom>
                Bienvenue sur le portail des services de cybersécurité
              </Typography>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ mb: 3 }}>
                Politique de Sécurité des Systèmes d'Information de l'Administration Publique
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                La solution complète pour évaluer et renforcer votre sécurité informatique
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  component={Link} 
                  to="/login"
                  sx={{ px: 4 }}
                >
                  Se connecter
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  component={Link} 
                  to="/register"
                  sx={{ px: 4, color: theme.palette.mode === 'light' ? 'primary.main' : 'common.white', 
                        borderColor: theme.palette.mode === 'light' ? 'primary.main' : 'common.white' }}
                >
                  S'inscrire
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Services Section */}
        <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Nos Services
        </Typography>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {services.map((service, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper elevation={2} sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[6]
                }
              }}>
                <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                  {service.title}
                </Typography>
                <Typography sx={{ flexGrow: 1 }}>
                  {service.description}
                </Typography>
                <Button 
                  component={Link} 
                  to={`/${service.title.toLowerCase().replace(/\s+/g, '-')}`} 
                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                >
                  En savoir plus
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Eligible Entities Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Qui peut accéder à nos services ?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Nos services sont destinés aux entités suivantes :
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {eligibleEntities.map((entity, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ 
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  boxShadow: theme.shadows[1]
                }}>
                  <Typography>{entity}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* About Us Section */}
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Qui sommes-nous ?
          </Typography>
          <Typography variant="body1" paragraph>
            Le Club des Responsables de Sécurité des Systèmes d'Information (RSSI) est une initiative 
            gouvernementale visant à renforcer la cybersécurité au sein des administrations publiques.
          </Typography>
          <Typography variant="body1" paragraph>
            Notre mission est d'accompagner les entités publiques dans la mise en œuvre de leur politique 
            de sécurité des systèmes d'information, conformément aux exigences réglementaires et aux meilleures 
            pratiques du secteur.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/about" 
            sx={{ mt: 2 }}
          >
            Découvrir notre organisation
          </Button>
        </Paper>
      </Container>
      
      <Footer />
    </Box>
  );
}