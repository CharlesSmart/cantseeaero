import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import type { Server as HTTPServer } from 'http';

// Define the type for the socket server
interface SocketServer {
  io?: Server;
  [key: string]: unknown;
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
  console.log('🔍 Signaling API called with method:', req.method);
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('🔍 Handling OPTIONS request');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
      res.status(200).end();
      return;
    }

    // Check if response socket exists
    if (!res.socket) {
      console.error('❌ No socket found in response');
      res.status(500).json({ error: 'No socket found in response' });
      return;
    }

    console.log('🔍 Socket exists, checking for server property');
    
    // Check if socket server exists
    const socketWithServer = res.socket as unknown as SocketWithServer;
    if (!socketWithServer.server) {
      console.error('❌ No server property found on socket');
      res.status(500).json({ error: 'No server property found on socket' });
      return;
    }

    // Check if Socket.IO server is already running
    if (socketWithServer.server.io) {
      console.log('✅ Socket.IO server already running');
      res.end();
      return;
    }

    console.log('🔍 Setting up Socket.IO server');
    
    try {
      const httpServer = socketWithServer.server as unknown as HTTPServer;
      console.log('🔍 HTTP server type:', typeof httpServer);
      console.log('🔍 HTTP server properties:', Object.keys(httpServer));
      
      // Create Socket.IO server with multiple path support
      const io = new Server(httpServer, {
        path: '/api/signaling',
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        },
        connectTimeout: 45000,
        pingTimeout: 30000,
        transports: ['polling', 'websocket']
      });
      
      // Create a second instance for the /socket.io path
      const ioLegacy = new Server(httpServer, {
        path: '/socket.io',
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        },
        connectTimeout: 45000,
        pingTimeout: 30000,
        transports: ['polling', 'websocket']
      });
      
      socketWithServer.server.io = io;
      console.log('✅ Socket.IO servers created successfully');

      // Helper function to set up event handlers for a socket
      const setupSocketHandlers = (socket: any, isLegacy = false) => {
        const prefix = isLegacy ? '[Legacy] ' : '';
        console.log(`✅ ${prefix}New client connected:`, socket.id);
        
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
                  if (isLegacy) ioLegacy.to(session.desktop).emit('session-timeout');
                  sessions.delete(sessionId);
                  console.log(`⏱️ ${prefix}Session timed out:`, sessionId);
                }
              }
            }, SESSION_TIMEOUT)
          });
          
          console.log(`✅ ${prefix}Session created:`, sessionId);
          socket.emit('session-created', { sessionId });
        });

        // Handle mobile connection
        socket.on('join-session', ({ sessionId }) => {
          console.log(`🔍 ${prefix}Join session attempt:`, sessionId);
          if (sessions.has(sessionId)) {
            const session = sessions.get(sessionId);
            if (session) {
              // Clear timeout as connection is established
              clearTimeout(session.timeout);
              
              // Update session with mobile socket id
              session.mobile = socket.id;
              
              console.log(`✅ ${prefix}Mobile connected to session:`, sessionId);
              
              // Notify desktop that mobile has connected
              io.to(session.desktop).emit('mobile-connected');
              if (isLegacy) ioLegacy.to(session.desktop).emit('mobile-connected');
              
              // Notify mobile that connection is successful
              socket.emit('connection-successful');
            }
          } else {
            console.log(`❌ ${prefix}Session not found:`, sessionId);
            socket.emit('session-not-found');
          }
        });

        // Handle WebRTC signaling
        socket.on('signal', ({ sessionId, signal }) => {
          console.log(`🔍 ${prefix}Signal received for session:`, sessionId);
          if (sessions.has(sessionId)) {
            const session = sessions.get(sessionId);
            if (session) {
              const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
              
              if (targetId) {
                console.log(`✅ ${prefix}Forwarding signal to:`, targetId);
                io.to(targetId).emit('signal', { signal });
                if (isLegacy) ioLegacy.to(targetId).emit('signal', { signal });
              } else {
                console.log(`❌ ${prefix}Target not found for signal`);
              }
            }
          } else {
            console.log(`❌ ${prefix}Session not found for signal:`, sessionId);
          }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
          console.log(`🔍 ${prefix}Client disconnected:`, socket.id, 'Reason:', reason);
          // Find and clean up any sessions this socket was part of
          for (const [sessionId, session] of sessions.entries()) {
            if (session.desktop === socket.id || session.mobile === socket.id) {
              const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
              
              if (targetId) {
                console.log(`✅ ${prefix}Notifying peer of disconnection:`, targetId);
                io.to(targetId).emit('peer-disconnected');
                if (isLegacy) ioLegacy.to(targetId).emit('peer-disconnected');
              }
              
              console.log(`✅ ${prefix}Removing session:`, sessionId);
              sessions.delete(sessionId);
              break;
            }
          }
        });

        // Handle errors
        socket.on('error', (error) => {
          console.error(`❌ ${prefix}Socket error:`, error);
        });
      };

      // Set up handlers for both server instances
      io.on('connection', (socket) => setupSocketHandlers(socket, false));
      ioLegacy.on('connection', (socket) => setupSocketHandlers(socket, true));

      io.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
      });

      ioLegacy.on('connect_error', (error) => {
        console.error('❌ Legacy Socket.IO connection error:', error);
      });

      console.log('✅ Socket.IO servers initialized');
      res.end();
      
    } catch (error) {
      console.error('❌ Error setting up Socket.IO server:', error);
      res.status(500).json({ error: 'Error setting up Socket.IO server', details: error instanceof Error ? error.message : String(error) });
    }
  } catch (error) {
    console.error('❌ Unhandled error in signaling API:', error);
    res.status(500).json({ error: 'Unhandled error in signaling API', details: error instanceof Error ? error.message : String(error) });
  }
} 