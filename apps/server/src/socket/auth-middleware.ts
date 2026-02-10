import { jwtVerify } from 'jose';
import type { Socket } from 'socket.io';
import { config } from '../config.js';

const secret = new TextEncoder().encode(config.JWT_SECRET);

export interface AuthPayload {
  userId: string;
  name: string;
}

/** Socket.io middleware that verifies JWT and attaches user data */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const name = payload.name as string;

    if (!userId || !name) {
      return next(new Error('Invalid token payload'));
    }

    // Attach to socket data
    socket.data.userId = userId;
    socket.data.name = name;

    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
