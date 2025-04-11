import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CameraPreviewProps {
  sessionId: string | null;
  onCapture: (imageData: string) => void;
  onDisconnect: () => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ sessionId, onCapture, onDisconnect }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const isComponentMounted = useRef<boolean>(true); // Track component mount state
  
  useEffect(() => {
    // Add a log to see when the effect runs and with what sessionId
    console.log(`[CameraPreview Effect] Running effect. Session ID: ${sessionId}`);
    
    if (!sessionId) {
      console.log('[CameraPreview Effect] No session ID, setting error state.');
      setStatus('error');
      setErrorMessage('No session ID provided');
      return;
    }
    
    // Reset state if sessionId changes
    setStatus('connecting');
    setErrorMessage(null);
    isComponentMounted.current = true; // Ensure mount state is true when effect re-runs with a valid sessionId
    
    // Connect to signaling server
    let socket: Socket;
    try {
      console.log('[CameraPreview Effect] Attempting to connect socket...');
      socket = io('https://cantseeaero-signalling-server.onrender.com', {
        transports: ['polling', 'websocket']
      });
      socketRef.current = socket;
      console.log('[CameraPreview Effect] Socket object created.');
      
      // --- Add Socket Event Listeners ---
      socket.on('connect', () => {
        if (!isComponentMounted.current) return;
        console.log(`[Socket] Connected! Socket ID: ${socket.id}. Joining session: ${sessionId}`);
        // Join the session room upon successful connection
        safeEmit('join-session', { sessionId }); 
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected. Reason: ${reason}`);
        if (isComponentMounted.current) {
          // Optionally handle socket disconnect differently, maybe attempt reconnect?
          // For now, treating it as an error might be okay, but could be refined.
          // setStatus('error'); 
          // setErrorMessage(`Socket disconnected: ${reason}`);
        }
      });
      
      socket.on('signal', ({ signal }: { signal: SimplePeer.SignalData }) => {
        console.log('[Socket] Received signal from peer:', {
          type: signal.type,
          // Only log SDP if it's an offer or answer
          details: 'type' in signal ? signal.type : 'ICE candidate',
          timestamp: new Date().toISOString()
        });
        if (signal && isComponentMounted.current) {
          safeSignal(signal);
        } else {
          console.log('[Socket] Ignoring received signal (component unmounted or signal null).');
        }
      });
      
      socket.on('peer-disconnected', () => {
        console.log('[Socket] Received peer-disconnected event.');
        if (isComponentMounted.current) {
          setStatus('error');
          setErrorMessage('Phone disconnected');
          onDisconnect(); // Ensure parent knows
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error('[Socket] Connection Error:', error);
        if (isComponentMounted.current) {
          setStatus('error');
          setErrorMessage(`Socket connection error: ${error.message}`);
        }
      });
      // --- End Socket Event Listeners ---

    } catch (err) {
      console.error('[CameraPreview Effect] Socket initialization error:', err);
      setStatus('error');
      setErrorMessage(`Socket initialization error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    
    // Safe emit function to prevent calling methods on undefined objects
    const safeEmit = (event: string, data: Record<string, unknown>) => {
      if (socketRef.current && isComponentMounted.current) {
        try {
          console.log(`[Socket] Emitting ${event}:`, data);
          socketRef.current.emit(event, data);
        } catch (err) {
          console.error(`Error emitting ${event}:`, err);
        }
      } else {
         console.log(`[Socket] Cannot emit ${event} (socket null or component unmounted).`);
      }
    };
    
    // Create WebRTC peer
    let peer: SimplePeer.Instance;
    try {
      console.log('[CameraPreview Effect] Checking WebRTC support...');
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC is not supported in this browser');
      }
      
      console.log('[CameraPreview Effect] Creating SimplePeer instance (initiator: false)...');
      peer = new SimplePeer({
        initiator: false, // Desktop waits for the mobile initiator's offer
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
            // Consider adding TURN servers here if needed
          ]
        }
      });
      
      if (!peer) {
        throw new Error('Failed to create peer connection (SimplePeer returned nullish)');
      }
      console.log('[CameraPreview Effect] SimplePeer instance created.');
      peerRef.current = peer;

      // --- Add Peer Event Listeners ---
      peer.on('signal', (data: SimplePeer.SignalData) => {
        console.log('[Peer] Generated signal:', {
          type: data.type,
          details: 'type' in data ? data.type : 'ICE candidate',
          timestamp: new Date().toISOString()
        });
        if (isComponentMounted.current) {
          safeEmit('signal', { sessionId, signal: data });
        } else {
          console.log('[Peer] Ignoring generated signal (component unmounted).');
        }
      });
      
      peer.on('connect', () => {
        const peerConnection = (peer as SimplePeer.Instance & { _pc: RTCPeerConnection })._pc;
        console.log('[Peer] Connection established!', {
          timestamp: new Date().toISOString(),
          iceConnectionState: peerConnection?.iceConnectionState,
          signalingState: peerConnection?.signalingState
        });
        if (isComponentMounted.current) {
          console.log('[Peer] Waiting for stream...');
        }
      });

      peer.on('stream', (stream) => {
        console.log('[Peer] Received stream:', stream);
        if (videoRef.current && isComponentMounted.current) {
          try {
            console.log('[Peer] Attaching stream to video element.');
            videoRef.current.srcObject = stream;
            setStatus('connected'); // Set connected status *after* stream is attached
          } catch (err) {
            console.error('[Peer] Error setting video stream:', err);
            if (isComponentMounted.current) {
              setStatus('error');
              setErrorMessage(`Error setting video stream: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        } else {
           console.log('[Peer] Cannot attach stream (videoRef null or component unmounted).');
        }
      });
      
      peer.on('data', (data) => {
        if (!isComponentMounted.current) {
           console.log('[Peer] Ignoring received data (component unmounted).');
           return;
        }
        
        try {
          const message = JSON.parse(data.toString());
          console.log('[Peer] Received data:', message);
          if (message.type === 'capture') {
            console.log('[Peer] Received capture command, capturing frame...');
            captureFrame();
          }
        } catch (err) {
          console.error('[Peer] Error parsing data:', err);
        }
      });
      
      peer.on('error', (err) => {
        console.error('[Peer] Error:', err);
        if (isComponentMounted.current) {
          setStatus('error');
          // Provide more context if available, e.g., err.code
          const errorCode = (err as Error & { code?: string }).code ? ` (Code: ${(err as Error & { code?: string }).code})` : ''; 
          setErrorMessage(`Peer connection error: ${err.message}${errorCode}`);
        }
      });

      peer.on('close', () => {
        console.log('[Peer] Connection closed.');
         if (isComponentMounted.current) {
           // Decide how to handle peer closing - maybe different from general error
           setStatus('error'); 
           setErrorMessage('Peer connection closed');
           onDisconnect(); // Notify parent
         }
      });

      // Add ICE connection state monitoring
      peer.on('iceStateChange', (state) => {
        console.log('[Peer] ICE connection state changed:', {
          state,
          timestamp: new Date().toISOString(),
          peerConnected: peer.connected
        });
      });
      // --- End Peer Event Listeners ---

    } catch (err) {
      console.error('[CameraPreview Effect] Peer initialization error:', err);
      setStatus('error');
      setErrorMessage(`Peer initialization error: ${err instanceof Error ? err.message : String(err)}`);
      // Clean up socket if peer fails to initialize
      if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
      }
      return;
    }
    
    // Safe signal function to prevent race conditions
    const safeSignal = (data: SimplePeer.SignalData) => {
      if (peerRef.current && isComponentMounted.current && !peerRef.current.destroyed) {
        try {
          console.log('[Peer] Signaling with received data:', data);
          peerRef.current.signal(data);
        } catch (err) {
          console.error('[Peer] Error signaling peer:', err);
          if (isComponentMounted.current) {
            setStatus('error');
            setErrorMessage(`Signaling error: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      } else {
         console.log('[Peer] Cannot signal (peer null, destroyed, or component unmounted).');
      }
    };
    
    // Cleanup function
    return () => {
      console.log('[CameraPreview Cleanup] Running cleanup...');
      // Mark component as unmounted
      isComponentMounted.current = false; 
      
      if (peerRef.current) {
        console.log('[CameraPreview Cleanup] Destroying peer...');
        try {
          peerRef.current.destroy();
        } catch (err) {
          console.error('[CameraPreview Cleanup] Error destroying peer:', err);
        }
        peerRef.current = null;
      } else {
         console.log('[CameraPreview Cleanup] Peer already null.');
      }
      
      if (socketRef.current) {
        console.log('[CameraPreview Cleanup] Disconnecting socket...');
        try {
          // Optionally notify the server before disconnecting
          // safeEmit('leave-session', { sessionId }); 
          socketRef.current.disconnect();
        } catch (err) {
          console.error('[CameraPreview Cleanup] Error disconnecting socket:', err);
        }
        socketRef.current = null;
      } else {
         console.log('[CameraPreview Cleanup] Socket already null.');
      }
      
      // Clear video src
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
      console.log('[CameraPreview Cleanup] Cleanup finished.');
    };
    // Make sure all dependencies that can change are listed
  }, [sessionId, onCapture, onDisconnect]); 
  
  const captureFrame = () => {
    if (!videoRef.current || !isComponentMounted.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        onCapture(imageData);
      }
    } catch (err) {
      console.error('Error capturing frame:', err);
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage(`Error capturing frame: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
  
  const handleCaptureClick = () => {
    if (!peerRef.current || !peerRef.current.connected || !isComponentMounted.current) {
        console.log('[CaptureClick] Cannot send capture command (peer not ready or component unmounted).');
        return;
    }
    
    try {
      console.log('[CaptureClick] Sending capture command to peer...');
      peerRef.current.send(JSON.stringify({ type: 'capture' }));
    } catch (err) {
      console.error('[CaptureClick] Error sending capture command:', err);
      // Avoid setting global error state just for failing to send a command maybe?
      // Or display a temporary error message near the button.
      // setStatus('error'); 
      // setErrorMessage(`Error sending capture command: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Log status changes
  useEffect(() => {
    console.log(`[CameraPreview Status] Status changed to: ${status}, Error: ${errorMessage || 'None'}`);
  }, [status, errorMessage]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg shadow-lg"
        />
        
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <p className="text-white">Connecting to phone camera...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <p className="text-white">{errorMessage}</p>
          </div>
        )}
      </div>
      
      {status === 'connected' && (
        <Button 
          onClick={handleCaptureClick}
          className="flex items-center"
          aria-label="Take photo"
        >
          <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
          Take Photo
        </Button>
      )}
    </div>
  );
};

export default CameraPreview; 