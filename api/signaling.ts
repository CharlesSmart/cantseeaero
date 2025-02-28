import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

// Store active sessions
const sessions = new Map();

// Session timeout (10 seconds)
const SESSION_TIMEOUT = 10000;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket.server.io) {
    // Socket.IO server is already running
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    // Handle new connection
    socket.on('create-session', () => {
      const sessionId = uuidv4();
      sessions.set(sessionId, {
        desktop: socket.id,
        mobile: null,
        created: Date.now(),
        timeout: setTimeout(() => {
          // Remove session after timeout
          if (sessions.has(sessionId)) {
            const session = sessions.get(sessionId);
            if (!session.mobile) {
              io.to(session.desktop).emit('session-timeout');
              sessions.delete(sessionId);
            }
          }
        }, SESSION_TIMEOUT)
      });
      
      socket.emit('session-created', { sessionId });
    });

    // Handle mobile connection
    socket.on('join-session', ({ sessionId }) => {
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        
        // Clear timeout as connection is established
        clearTimeout(session.timeout);
        
        // Update session with mobile socket id
        session.mobile = socket.id;
        
        // Notify desktop that mobile has connected
        io.to(session.desktop).emit('mobile-connected');
        
        // Notify mobile that connection is successful
        socket.emit('connection-successful');
      } else {
        socket.emit('session-not-found');
      }
    });

    // Handle WebRTC signaling
    socket.on('signal', ({ sessionId, signal }) => {
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
        
        if (targetId) {
          io.to(targetId).emit('signal', { signal });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and clean up any sessions this socket was part of
      for (const [sessionId, session] of sessions.entries()) {
        if (session.desktop === socket.id || session.mobile === socket.id) {
          const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
          
          if (targetId) {
            io.to(targetId).emit('peer-disconnected');
          }
          
          sessions.delete(sessionId);
          break;
        }
      }
    });
  });

  res.end();
} 