import express from 'express';
import http from 'http';
import { Server as SocketIo } from 'socket.io';
import { spawn } from 'child_process';

const app = express();
const server = http.createServer(app);
const io = new SocketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let ffmpegProcess = null;
let rtmpKey = '';
let streamStartTime = null;

const startFFmpeg = () => {
  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${rtmpKey}`;
  
  const options = [
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', '25',
    '-g', '50',
    '-keyint_min', '25',
    '-crf', '25',
    '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0',
    '-profile:v', 'main',
    '-level', '3.1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv',
    rtmpUrl
  ];

  ffmpegProcess = spawn('ffmpeg', options);

  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`ffmpeg stdout: ${data}`);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.log(`ffmpeg stderr: ${data}`);
    if (data.toString().includes('Opening')) {
      console.log('Stream connection to YouTube established');
      streamStartTime = Date.now();
    }
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
    if (streamStartTime) {
      const duration = (Date.now() - streamStartTime) / 1000;
      console.log(`Stream to YouTube ended. Total duration: ${duration.toFixed(2)} seconds`);
      streamStartTime = null;
    }
  });
};

io.on('connection', socket => {
  console.log(`Socket connected`, socket.id);

  socket.on('start-stream', ({ rtmpKey: key }) => {
    if (ffmpegProcess) {
      console.log('Stream already in progress');
      return;
    }
    rtmpKey = key;
    console.log('RTMP Key set, starting FFmpeg process');
    startFFmpeg();
  });

  socket.on('setRTMPKey', (key) => {
    rtmpKey = key;
    console.log('RTMP Key set');
    if (ffmpegProcess) {
      console.log('Restarting FFmpeg process with new RTMP Key');
      ffmpegProcess.kill();
    }
    startFFmpeg();
  });

  socket.on('binarystream', stream => {
    if (ffmpegProcess && ffmpegProcess.stdin.writable) {
      ffmpegProcess.stdin.write(stream);
      if (streamStartTime) {
        const duration = (Date.now() - streamStartTime) / 1000;
        console.log(`Streaming to YouTube. Current duration: ${duration.toFixed(2)} seconds`);
      }
    } else {
      console.log('FFmpeg process not ready to receive stream data');
    }
  });

  socket.on('end-stream', () => {
    if (ffmpegProcess) {
      console.log('Ending stream...');
      ffmpegProcess.stdin.end();
      ffmpegProcess.kill('SIGINT');
      ffmpegProcess = null;
    }
  });

  socket.on('disconnect', () => {
    if (ffmpegProcess) {
      console.log('Socket disconnected, killing FFmpeg process');
      ffmpegProcess.kill();
      ffmpegProcess = null;
    }
  });
});

server.listen(3001, () => console.log('Backend server running on port 3001 ✅'));