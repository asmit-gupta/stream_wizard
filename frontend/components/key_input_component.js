import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

const RTMPKeyInput = ({ onKeySubmit }) => {
  const [rtmpKey, setRtmpKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onKeySubmit(rtmpKey);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="YouTube RTMP Key"
        value={rtmpKey}
        onChange={(e) => setRtmpKey(e.target.value)}
        margin="normal"
        type="password"
      />
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Set RTMP Key
      </Button>
    </Box>
  );
};

export default RTMPKeyInput;