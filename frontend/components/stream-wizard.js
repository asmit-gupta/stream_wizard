import React, { useEffect, useRef, useState } from 'react';
import { Button, Box } from '@mui/material';
import io from 'socket.io-client';

const StreamWizard = () => {
  const videoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      videoRef.current.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        framerate: 25
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          socket.emit('binarystream', event.data);
        }
      };

      mediaRecorder.start(25);
      setStreaming(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  return (
    <Box>
      <video ref={videoRef} autoPlay muted style={{ width: '100%', maxWidth: '640px' }} />
      <Button variant="contained" color="primary" onClick={startStream} disabled={streaming}>
        {streaming ? 'Streaming...' : 'Start Stream'}
      </Button>
    </Box>
  );
};

export default StreamWizard;