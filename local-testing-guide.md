# Local Testing Guide for QR Code Camera Feature

## Prerequisites

1. **Local HTTPS Setup**: WebRTC and camera access require HTTPS, even for local development
2. **Tunnel Service**: To make your local server accessible via HTTPS from your phone
3. **Socket.IO Server**: For signaling between devices

## Step 1: Modify the Socket.IO Connection

When testing locally, you need to connect to your local server instead of a production endpoint.

### Update QRCodeModal.tsx

```typescript
// Change this line:
const newSocket = io();

// To this:
const newSocket = io('https://your-tunnel-url.ngrok.io');
```

### Update MobileCameraPage.tsx

```typescript
// Change this line:
const socket = io();

// To this:
const socket = io('https://your-tunnel-url.ngrok.io');
```

## Step 2: Set Up a Local HTTPS Server

### Option 1: Using Vite with HTTPS

1. Install the required packages:
   ```bash
   npm install --save-dev @vitejs/plugin-basic-ssl
   ```

2. Update your `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import basicSsl from '@vitejs/plugin-basic-ssl';

   export default defineConfig({
     plugins: [react(), basicSsl()],
     server: {
       https: true,
       host: '0.0.0.0', // Allow connections from other devices
     }
   });
   ```

### Option 2: Using a Proxy Server (like ngrok)

1. Install ngrok:
   ```bash
   npm install --save-dev ngrok
   ```

2. Add a script to your package.json:
   ```json
   "scripts": {
     "dev": "vite",
     "tunnel": "ngrok http 5173"
   }
   ```

3. Run your development server:
   ```bash
   npm run dev
   ```

4. In another terminal, start the tunnel:
   ```bash
   npm run tunnel
   ```

5. Use the HTTPS URL provided by ngrok in your code and for testing.

## Step 3: Set Up a Local Socket.IO Server

Create a simple Express server for local development:

1. Create a file named `local-server.js`:
   ```javascript
   const express = require('express');
   const http = require('http');
   const { Server } = require('socket.io');
   const cors = require('cors');
   const { v4: uuidv4 } = require('uuid');

   const app = express();
   app.use(cors());
   const server = http.createServer(app);
   const io = new Server(server, {
     cors: {
       origin: '*',
       methods: ['GET', 'POST']
     }
   });

   // Store active sessions
   const sessions = new Map();

   // Session timeout (10 seconds)
   const SESSION_TIMEOUT = 10000;

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
             if (!session.mobile) {
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
         
         // Clear timeout as connection is established
         clearTimeout(session.timeout);
         
         // Update session with mobile socket id
         session.mobile = socket.id;
         
         console.log('Mobile connected to session:', sessionId);
         
         // Notify desktop that mobile has connected
         io.to(session.desktop).emit('mobile-connected');
         
         // Notify mobile that connection is successful
         socket.emit('connection-successful');
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
         const targetId = socket.id === session.desktop ? session.mobile : session.desktop;
         
         if (targetId) {
           console.log('Forwarding signal to:', targetId);
           io.to(targetId).emit('signal', { signal });
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

   const PORT = process.env.PORT || 3001;
   server.listen(PORT, () => {
     console.log(`Socket.IO server running on port ${PORT}`);
   });
   ```

2. Install the required dependencies:
   ```bash
   npm install express socket.io cors
   ```

3. Start the server:
   ```bash
   node local-server.js
   ```

## Step 4: Update QR Code URL Generation

In `QRCodeModal.tsx`, update the QR code URL to use your tunnel URL:

```typescript
const getQRUrl = () => {
  // Change this:
  const baseUrl = window.location.origin;
  
  // To this:
  const baseUrl = 'https://your-tunnel-url.ngrok.io';
  
  return `${baseUrl}/mobile-camera?sessionId=${sessionId}`;
};
```

## Step 5: Testing the Feature

1. Start your local development server with HTTPS
2. Start your Socket.IO server
3. Start your tunnel service
4. Open your app in a browser using the HTTPS URL from your tunnel
5. Click the "Phone Camera" button
6. Scan the QR code with your phone
7. Allow camera access on your phone
8. Verify that the camera feed appears on your desktop browser

## Troubleshooting

1. **Connection Issues**:
   - Check browser console for errors
   - Verify that all URLs are using HTTPS
   - Ensure your tunnel service is running

2. **Camera Access Denied**:
   - Make sure you're using HTTPS
   - Check browser permissions

3. **WebRTC Failures**:
   - Ensure your network allows WebRTC connections
   - Try using a different network if behind a restrictive firewall

4. **QR Code Not Working**:
   - Verify the URL in the QR code is correct
   - Make sure your phone can access the tunnel URL

## Alternative: Deploy to Vercel Preview

If local testing proves difficult, you can use Vercel Preview Deployments:

1. Push your changes to a branch
2. Create a pull request
3. Vercel will automatically create a preview deployment
4. Test using the preview URL

This approach provides a fully functional environment without the complexity of local HTTPS setup. 