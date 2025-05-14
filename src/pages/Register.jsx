import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormGroup,
  FormControl,
  FormLabel,
  MenuItem,
  Paper
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';

export default function Register() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: '',
    entite_nom: '',
    secteur: [],
    taille: 'Moyenne'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: 'DSI', label: 'Directeur des Systèmes d\'Information (DSI)' },
    { value: 'RSSI', label: 'Responsable de la Sécurité des SI (RSSI)' },
    { value: 'DG', label: 'Directeur Général (DG)' },
    { value: 'Dir Cab', label: 'Directeur de Cabinet (Dir Cab)' }
  ];

  const secteurs = [
    { value: 'EPA', label: 'Établissement Public Administratif (EPA)' },
    { value: 'EPIC', label: 'Établissement Public Industriel et Commercial (EPIC)' },
    { value: 'CH', label: 'Centre Hospitalier (CH)' },
    { value: 'Ministères', label: 'Ministères' },
    { value: 'Collectivites', label: 'Collectivités Territoriales' },
    { value: 'Assimilies', label: 'Établissements Assimilés' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value
    }));
  };

  const handleSecteurChange = (secteurValue) => {
    setFormData(prev => {
      const newSecteurs = prev.secteur.includes(secteurValue)
        ? prev.secteur.filter(s => s !== secteurValue)
        : [...prev.secteur, secteurValue];
      
      return {
        ...prev,
        secteur: newSecteurs
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.nom || !formData.email || !formData.mot_de_passe || !formData.entite_nom || !formData.role || formData.secteur.length === 0) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (formData.mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    
    try {
      const result = await register({
        ...formData,
        secteur: formData.secteur.join(', ')
      });
      
      if (result.success) {
        navigate('/login', { 
          state: { 
            registrationSuccess: true,
            email: formData.email 
          } 
        });
      } else {
        setError(result.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <HowToRegIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography component="h1" variant="h5" sx={{ mt: 1 }}>
          Création de compte
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nom"
                required
                fullWidth
                label="Nom complet"
                autoFocus
                value={formData.nom}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                required
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="mot_de_passe"
                required
                fullWidth
                label="Mot de passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleChange}
                helperText="Minimum 8 caractères"
              />
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #ddd' }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" required>
                    Sélectionnez votre rôle
                  </FormLabel>
                  <RadioGroup
                    name="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                  >
                    <Grid container spacing={1}>
                      {roles.map((role) => (
                        <Grid item xs={12} sm={6} key={role.value}>
                          <FormControlLabel
                            value={role.value}
                            control={<Radio color="primary" />}
                            label={role.label}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </RadioGroup>
                </FormControl>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="entite_nom"
                required
                fullWidth
                label="Nom de l'entité"
                value={formData.entite_nom}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #ddd' }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" required>
                    Secteur(s) d'appartenance
                  </FormLabel>
                  <FormGroup>
                    <Grid container spacing={1}>
                      {secteurs.map((secteur) => (
                        <Grid item xs={12} sm={6} key={secteur.value}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.secteur.includes(secteur.value)}
                                onChange={() => handleSecteurChange(secteur.value)}
                                name="secteur"
                                color="primary"
                              />
                            }
                            label={secteur.label}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </FormGroup>
                </FormControl>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <TextField
                  select
                  name="taille"
                  label="Taille de l'organisation"
                  value={formData.taille}
                  onChange={handleChange}
                >
                  <MenuItem value="Petite">Petite (1-50 employés)</MenuItem>
                  <MenuItem value="Moyenne">Moyenne (51-250 employés)</MenuItem>
                  <MenuItem value="Grande">Grande (251+ employés)</MenuItem>
                </TextField>
              </FormControl>
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/login" variant="body2">
                Déjà un compte? Se connecter
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}