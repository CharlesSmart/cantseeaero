import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import type { Server as HTTPServer } from 'http';

// Define the type for the socket server
interface SocketServer {
  io?: Server;
  [key: string]: any;
}

// Define the type for the socket with server
interface SocketWithServer {
  server: SocketServer;
}

// Define the type for the session
interface Session {
  desktop: string;
  mobile: string | null;
  created: number;
  timeout: NodeJS.Timeout;
}

// Store active sessions
const sessions = new Map<string, Session>();

// Session timeout (10 seconds)
const SESSION_TIMEOUT = 10000;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.status(200).end();
    return;
  }

  // Check if Socket.IO server is already running
  if (res.socket && (res.socket as unknown as SocketWithServer).server.io) {
    console.log('Socket.IO server already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.IO server');
  
  if (!res.socket) {
    console.error('No socket found in response');
    res.status(500).end();
    return;
  }
  
  const httpServer = (res.socket as unknown as SocketWithServer).server as unknown as HTTPServer;
  
  const io = new Server(httpServer, {
    path: '/api/signaling',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  (res.socket as unknown as SocketWithServer).server.io = io;

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
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
            if (session && !session.mobile) {
              io.to(session.desktop).emit('session-timeout');
              sessions.delete(sessionId);
            }
          }
        }, SESSION_TIMEOUT)
      });
      
      console.log('Session created:', sessionId);
      socket.emit('session-created', { sessionId });
    });

    // Handle mobile connection
    socket.on('join-session', ({ sessionId }) => {
      console.log('Join session attempt:', sessionId);
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        if (session) {
          // Clear timeout as connection is established
          clearTimeout(session.timeout);
          
          // Update session with mobile socket id
          session.mobile = socket.id;
          
          console.log('Mobile connected to session:', sessionId);
          
          // Notify desktop that mobile has connected
          io.to(session.desktop).emit('mobile-connected');
          
          // Notify mobile that connection is successful
          socket.emit('connection-successful');
        }
      } else {
        console.log('Session not found:', sessionId);
        socket.emit('session-not-found');
      }
    });

    // Handle WebRTC signaling
    socket.on('signal', ({ sessionId, signal }) => {
      console.log('Signal received for session:', sessionId);
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        if (session) {
          const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
          
          if (targetId) {
            console.log('Forwarding signal to:', targetId);
            io.to(targetId).emit('signal', { signal });
          }
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Find and clean up any sessions this socket was part of
      for (const [sessionId, session] of sessions.entries()) {
        if (session.desktop === socket.id || session.mobile === socket.id) {
          const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
          
          if (targetId) {
            console.log('Notifying peer of disconnection:', targetId);
            io.to(targetId).emit('peer-disconnected');
          }
          
          console.log('Removing session:', sessionId);
          sessions.delete(sessionId);
          break;
        }
      }
    });
  });

  console.log('Socket.IO server initialized');
  res.end();
} 