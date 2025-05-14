import React from 'react';
import { Box, Typography, Container } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 3, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Typography variant="body1" align="center">
          © 2025 PSSI AP Check - Tous droits réservés
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          Solution d'évaluation de sécurité pour entreprises
        </Typography>
      </Container>
    </Box>
  );
}