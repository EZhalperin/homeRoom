/** @type {any} */
let ioInstance = null;

/**
 * Initializes the realtime publisher with a Socket.io server instance.
 * @param {any} io
 */
export function initRealtime(io) {
  ioInstance = io;
}

/**
 * Emits an event to a specific user (room: `user:${userId}`).
 * Safe no-op if realtime is not initialized.
 * @param {string} userId
 * @param {string} event
 * @param {unknown} payload
 */
export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

/**
 * Emits an event to a room.
 * Safe no-op if realtime is not initialized.
 * @param {string} roomId
 * @param {string} event
 * @param {unknown} payload
 */
export function emitToRoom(roomId, event, payload) {
  if (!ioInstance || !roomId) return;
  ioInstance.to(roomId).emit(event, payload);
}

/**
 * Disconnects all active sockets for a specific user.
 * Safe no-op if realtime is not initialized.
 * @param {string} userId
 */
export function disconnectUser(userId) {
  if (!ioInstance || !userId) return;
  ioInstance.in(`user:${userId}`).disconnectSockets(true);
}

/**
 * Checks whether any socket of the given user is currently joined in `roomId`.
 * Safe no-op (returns false) if realtime is not initialized.
 * @param {string} userId
 * @param {string} roomId
 * @returns {boolean}
 */
export function isUserInRoom(userId, roomId) {
  if (!ioInstance || !userId || !roomId) return false;
  const userRoom = ioInstance.sockets?.adapter?.rooms?.get(`user:${userId}`);
  const targetRoom = ioInstance.sockets?.adapter?.rooms?.get(roomId);
  if (!userRoom || !targetRoom) return false;
  for (const socketId of userRoom) {
    if (targetRoom.has(socketId)) return true;
  }
  return false;
}