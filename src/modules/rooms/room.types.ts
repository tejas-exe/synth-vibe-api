import type { Socket } from 'socket.io';

export type RoomSnapshot = {
    roomCode: string;
    members: number;
};

export type RoomErrorPayload = {
    message: string;
    roomCode?: string;
    members?: number;
};

export type JoinRoomRequest = string | { roomCode?: string };

export type CreateRoomResponse = RoomSnapshot;
export type JoinRoomResponse = RoomSnapshot;
export type LeaveRoomResponse = RoomSnapshot;
export type LeaveRoomResult = RoomSnapshot & {
    deleted: boolean;
};

export type ClientToServerEvents = {
    'create-room': () => void;
    'join-room': (payload: JoinRoomRequest) => void;
    'leave-room': () => void;
};

export type ServerToClientEvents = {
    'room-created': (payload: CreateRoomResponse) => void;
    'room-joined': (payload: JoinRoomResponse) => void;
    'room-updated': (payload: RoomSnapshot) => void;
    'room-left': (payload: LeaveRoomResponse) => void;
    'room-error': (payload: RoomErrorPayload) => void;
    'room-full': (payload: RoomErrorPayload) => void;
};

export type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
