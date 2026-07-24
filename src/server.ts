import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { createSocketServer } from './config/socket.ts';
import { RoomService } from './modules/rooms/room.service.ts';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = createApp();
const httpServer = createServer(app);
const roomService = new RoomService();

createSocketServer(httpServer, roomService);

httpServer.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT} 🎵`);
});
