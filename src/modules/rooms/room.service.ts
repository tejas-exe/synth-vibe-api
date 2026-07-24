import { randomInt } from 'node:crypto';
import {
    MAX_ROOM_USERS,
    ROOM_CODE_ALPHABET,
    ROOM_CODE_LENGTH,
} from './room.constants.ts';
import type { LeaveRoomResult, RoomSnapshot } from './room.types.ts';

type RoomState = {
    members: Set<string>;
};

type JoinRoomResult =
    | {
          ok: true;
          room: RoomSnapshot;
          previousRoomCode?: string;
      }
    | {
          ok: false;
          error: RoomSnapshot & { message: string };
      };

export class RoomService {
    private readonly rooms = new Map<string, RoomState>();

    private readonly socketRooms = new Map<string, string>();

    createRoom(socketId: string): RoomSnapshot {
        const roomCode = this.generateUniqueRoomCode();
        const room: RoomState = {
            members: new Set<string>([socketId]),
        };

        this.rooms.set(roomCode, room);
        this.socketRooms.set(socketId, roomCode);

        return this.toSnapshot(roomCode, room);
    }

    joinRoom(socketId: string, roomCode: string): JoinRoomResult {
        const normalizedCode = this.normalizeRoomCode(roomCode);
        const room = this.rooms.get(normalizedCode);

        if (!room) {
            return {
                ok: false,
                error: {
                    message: 'Room not found',
                    roomCode: normalizedCode,
                    members: 0,
                },
            };
        }

        const currentRoomCode = this.socketRooms.get(socketId);
        const isAlreadyInTargetRoom = currentRoomCode === normalizedCode;
        const isRoomFull = room.members.size >= MAX_ROOM_USERS && !isAlreadyInTargetRoom;

        if (isRoomFull) {
            return {
                ok: false,
                error: {
                    message: 'This room already has 4 users',
                    roomCode: normalizedCode,
                    members: room.members.size,
                },
            };
        }

        if (currentRoomCode && currentRoomCode !== normalizedCode) {
            this.removeSocketFromRoom(socketId, currentRoomCode);
        }

        room.members.add(socketId);
        this.socketRooms.set(socketId, normalizedCode);

        return {
            ok: true,
            room: this.toSnapshot(normalizedCode, room),
            ...(currentRoomCode && currentRoomCode !== normalizedCode
                ? { previousRoomCode: currentRoomCode }
                : {}),
        };
    }

    leaveSocket(socketId: string): LeaveRoomResult | null {
        const roomCode = this.socketRooms.get(socketId);

        if (!roomCode) {
            return null;
        }

        return this.removeSocketFromRoom(socketId, roomCode);
    }

    getRoomSnapshot(roomCode: string): RoomSnapshot | null {
        const normalizedCode = this.normalizeRoomCode(roomCode);
        const room = this.rooms.get(normalizedCode);

        if (!room) {
            return null;
        }

        return this.toSnapshot(normalizedCode, room);
    }

    private removeSocketFromRoom(socketId: string, roomCode: string): LeaveRoomResult | null {
        const room = this.rooms.get(roomCode);

        if (!room) {
            this.socketRooms.delete(socketId);
            return null;
        }

        room.members.delete(socketId);
        this.socketRooms.delete(socketId);

        if (room.members.size === 0) {
            this.rooms.delete(roomCode);
            return {
                roomCode,
                members: 0,
                deleted: true,
            };
        }

        return {
            ...this.toSnapshot(roomCode, room),
            deleted: false,
        };
    }

    private generateUniqueRoomCode(): string {
        let roomCode = this.generateRoomCode();

        while (this.rooms.has(roomCode)) {
            roomCode = this.generateRoomCode();
        }

        return roomCode;
    }

    private generateRoomCode(length = ROOM_CODE_LENGTH): string {
        let code = '';

        for (let index = 0; index < length; index += 1) {
            code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
        }

        return code;
    }

    private normalizeRoomCode(roomCode: string): string {
        return roomCode.trim().toUpperCase();
    }

    private toSnapshot(roomCode: string, room: RoomState): RoomSnapshot {
        return {
            roomCode,
            members: room.members.size,
        };
    }
}
