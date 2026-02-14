class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  createRoom(roomCode, hostSocketId, username) {
    const room = {
      roomCode,
      hostSocketId,
      participants: new Map(),
      isSharing: false,
      createdAt: Date.now(),
    };
    room.participants.set(hostSocketId, { username, muted: true });
    this.rooms.set(roomCode, room);
    return room;
  }

  joinRoom(roomCode, socketId, username) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    room.participants.set(socketId, { username, muted: true });
    return room;
  }

  leaveRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    room.participants.delete(socketId);

    if (room.participants.size === 0) {
      this.rooms.delete(roomCode);
      return null;
    }

    // If the host left, assign a new host
    if (room.hostSocketId === socketId) {
      const newHostId = room.participants.keys().next().value;
      room.hostSocketId = newHostId;
      room.isSharing = false;
    }

    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode) || null;
  }

  setMicStatus(roomCode, socketId, muted) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const participant = room.participants.get(socketId);
    if (participant) {
      participant.muted = muted;
    }
  }

  setSharing(roomCode, isSharing) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.isSharing = isSharing;
  }
}

module.exports = new RoomManager();
