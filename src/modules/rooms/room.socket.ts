import type { Server } from 'socket.io';
import type { RoomService } from './room.service.ts';
import type {
    ClientToServerEvents,
    ServerSocket,
    ServerToClientEvents,
} from './room.types.ts';

export function registerRoomSocketHandlers(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: ServerSocket,
    roomService: RoomService,
) {
    socket.on('create-room', () => {
        const previousRoom = roomService.leaveSocket(socket.id);

        if (previousRoom) {
            socket.leave(previousRoom.roomCode);
            if (!previousRoom.deleted) {
                io.to(previousRoom.roomCode).emit('room-updated', previousRoom);
            }
        }

        const room = roomService.createRoom(socket.id);
        socket.join(room.roomCode);
        socket.emit('room-created', room);
        io.to(room.roomCode).emit('room-updated', room);
    });

    socket.on('join-room', (payload) => {
        const roomCode = typeof payload === 'string' ? payload : payload.roomCode;

        if (!roomCode) {
            socket.emit('room-error', {
                message: 'Room code is required',
            });
            return;
        }

        const result = roomService.joinRoom(socket.id, roomCode);

        if (!result.ok) {
            socket.emit('room-error', result.error);
            if (result.error.members >= 4) {
                socket.emit('room-full', result.error);
            }
            return;
        }

        if (result.previousRoomCode) {
            socket.leave(result.previousRoomCode);

            const previousRoom = roomService.getRoomSnapshot(result.previousRoomCode);
            if (previousRoom) {
                io.to(result.previousRoomCode).emit('room-updated', previousRoom);
            }
        }

        socket.join(result.room.roomCode);
        socket.emit('room-joined', result.room);
        io.to(result.room.roomCode).emit('room-updated', result.room);
    });

    socket.on('leave-room', () => {
        const room = roomService.leaveSocket(socket.id);

        if (!room) {
            socket.emit('room-error', {
                message: 'You are not in a room',
            });
            return;
        }

        socket.leave(room.roomCode);
        socket.emit('room-left', {
            roomCode: room.roomCode,
            members: room.members,
        });

        if (!room.deleted) {
            io.to(room.roomCode).emit('room-updated', room);
        }
    });

    socket.on('disconnect', () => {
        const room = roomService.leaveSocket(socket.id);

        if (!room) {
            return;
        }

        socket.leave(room.roomCode);
        if (!room.deleted) {
            io.to(room.roomCode).emit('room-updated', room);
        }
    });
}
