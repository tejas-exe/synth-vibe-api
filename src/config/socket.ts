import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { registerRoomSocketHandlers } from '../modules/rooms/room.socket.ts';
import type { RoomService } from '../modules/rooms/room.service.ts';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '../modules/rooms/room.types.ts';

export function createSocketServer(
    httpServer: HttpServer,
    roomService: RoomService,
) {
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        registerRoomSocketHandlers(io, socket, roomService);
    });

    return io;
}
