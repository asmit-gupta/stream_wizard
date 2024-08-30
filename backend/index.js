import http from 'http'
import express from 'express'
import { spawn } from 'child_process'
import { Server as SocketIo } from 'socket.io'

const app = express();
const server = http.createServer(app);
const io = new SocketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const options = [
  '-i',
  '-',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-tune', 'zerolatency',
  '-r', `${25}`,
  '-g', `${25 * 2}`,
  '-keyint_min', 25,
  '-crf', '25',
  '-pix_fmt', 'yuv420p',
  '-sc_threshold', '0',
  '-profile:v', 'main',
  '-level', '3.1',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-ar', 128000 / 4,
  '-f', 'flv',
  `rtmp://a.rtmp.youtube.com/live2/dcfx-m7v2-j248-3185-9207`,
];

const ffmpegProcess = spawn('ffmpeg', options);

ffmpegProcess.stdout.on('data', (data) => {
  console.log(`ffmpeg stdout': ${data}`);
});

ffmpegProcess.stderr.on('data', (data) => {
  console.log(`ffmpeg stderr: ${data}`);
});

ffmpegProcess.on('close', (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
});

io.on('connection', socket => {
  console.log(`Socket connected`, socket.id);
  socket.on('binarystream', stream => {
    console.log('Binary Stream Incoming...')
    ffmpegProcess.stdin.write(stream, (err) => {
      if (err) {
        console.log('Error occurred in stream!');
      }
    })
  })
})

server.listen(3001, () => console.log('Backend server running on port 3001 ✅'))