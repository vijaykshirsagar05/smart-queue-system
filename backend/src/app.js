import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import userRoutes from './routes/userRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';

app.use(cors({
  origin: allowedOrigin,
  credentials: allowedOrigin !== '*'
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin
  }
});

app.set('socket.io', io);

io.on('connection', (socket) => {
  console.log(`Live queue client connected: ${socket.id}`);
});

app.use('/api/users', userRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Smart Queue API' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Smart Queue API running on http://localhost:${PORT}`);
});

export default app;
