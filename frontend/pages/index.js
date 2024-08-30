import React from 'react';
import StreamWizard from '../components/stream-wizard';
import { Container, Typography } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="md">
      <Typography variant="h2" component="h1" gutterBottom>
        Stream Wizard
      </Typography>
      <StreamWizard />
    </Container>
  );
}