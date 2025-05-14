import React from 'react';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography,
  Grid,
  useTheme
} from '@mui/material';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const DOMAIN_CONFIG = {
  leadership_gouvernance: "Leadership & Gouvernance",
  organisation_securite: "Organisation Sécurité",
  gestion_risques: "Gestion des Risques",
  securite_rh: "Sécurité RH",
  gestion_actifs: "Gestion des actifs",
  gestion_acces: "Gestion des Accès"
};

const calculateDomainScores = (data) => {
  return Object.keys(DOMAIN_CONFIG).map(domain => {
    const domainData = data[domain];
    return typeof domainData === 'number' ? domainData : 0;
  });
};

export default function ComparisonRadar({ data }) {
  const theme = useTheme();
  
  if (!data?.currentEntite?.data || !data?.comparedSector?.data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <Typography variant="h6" color="textSecondary">
          Données de comparaison indisponibles
        </Typography>
      </Box>
    );
  }

  const domainLabels = Object.values(DOMAIN_CONFIG);
  const currentScores = calculateDomainScores(data.currentEntite.data);
  const sectorScores = calculateDomainScores(data.comparedSector.data);

  const chartData = {
    labels: domainLabels,
    datasets: [
      {
        label: data.currentEntite.name,
        data: currentScores,
        backgroundColor: 'rgba(63, 81, 181, 0.2)',
        borderColor: 'rgba(63, 81, 181, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(63, 81, 181, 1)'
      },
      {
        label: `Secteur ${data.comparedSector.name}`,
        data: sectorScores,
        backgroundColor: 'rgba(233, 30, 99, 0.2)',
        borderColor: 'rgba(233, 30, 99, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(233, 30, 99, 1)'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            size: theme.typography.fontSize
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}%`
        }
      },
      legend: {
        position: 'top',
        labels: {
          font: {
            size: theme.typography.fontSize
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader
        title={`Comparaison sectorielle`}
        subheader={
          <>
            <Typography variant="body2">
              {data.currentEntite.name}: {data.currentEntite.latestScore}% | 
              Secteur {data.comparedSector.name}: {data.comparedSector.averageScore}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dernière évaluation: {new Date(data.currentEntite.latestDate).toLocaleDateString()}
            </Typography>
          </>
        }
      />
      <CardContent>
        <Box sx={{ height: '500px' }}>
          <Radar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}


