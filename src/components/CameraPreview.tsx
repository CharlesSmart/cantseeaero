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
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID provided');
      return;
    }
    
    // Connect to signaling server
    let socket: Socket;
    try {
      socket = io('https://cantseeaero-signalling-server.onrender.com', {
        transports: ['polling', 'websocket']
      });
      socketRef.current = socket;
    } catch (err) {
      console.error('Socket initialization error:', err);
      setStatus('error');
      setErrorMessage(`Socket initialization error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    
    // Safe emit function to prevent calling methods on undefined objects
    const safeEmit = (event: string, data: Record<string, unknown>) => {
      if (socketRef.current && isComponentMounted.current) {
        try {
          socketRef.current.emit(event, data);
        } catch (err) {
          console.error(`Error emitting ${event}:`, err);
        }
      }
    };
    
    // Create WebRTC peer
    let peer: SimplePeer.Instance;
    try {
      // Check if required browser APIs are available
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC is not supported in this browser');
      }
      
      // Create peer with more specific options
      peer = new SimplePeer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });
      
      // Verify peer was created successfully
      if (!peer) {
        throw new Error('Failed to create peer connection');
      }
      
      peerRef.current = peer;
    } catch (err) {
      console.error('Peer initialization error:', err);
      setStatus('error');
      setErrorMessage(`Peer initialization error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    
    // Safe signal function to prevent race conditions
    const safeSignal = (data: SimplePeer.SignalData) => {
      if (peerRef.current && isComponentMounted.current) {
        try {
          peerRef.current.signal(data);
        } catch (err) {
          console.error('Error signaling peer:', err);
          if (isComponentMounted.current) {
            setStatus('error');
            setErrorMessage(`Signaling error: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    };
    
    peer.on('signal', (data) => {
      if (isComponentMounted.current) {
        safeEmit('signal', { sessionId, signal: data });
      }
    });
    
    peer.on('stream', (stream) => {
      if (videoRef.current && isComponentMounted.current) {
        try {
          videoRef.current.srcObject = stream;
          setStatus('connected');
        } catch (err) {
          console.error('Error setting video stream:', err);
          if (isComponentMounted.current) {
            setStatus('error');
            setErrorMessage(`Error setting video stream: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    });
    
    peer.on('data', (data) => {
      if (!isComponentMounted.current) return;
      
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'capture') {
          // Capture frame from video
          captureFrame();
        }
      } catch (err) {
        console.error('Error parsing data:', err);
      }
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage(`Connection error: ${err.message}`);
      }
    });
    
    socket.on('signal', ({ signal }: { signal: SimplePeer.SignalData }) => {
      if (signal && isComponentMounted.current) {
        safeSignal(signal);
      }
    });
    
    socket.on('peer-disconnected', () => {
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage('Phone disconnected');
        onDisconnect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage(`Connection error: ${error.message}`);
      }
    });
    
    return () => {
      // Mark component as unmounted
      isComponentMounted.current = false;
      
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying peer:', err);
        }
        peerRef.current = null;
      }
      
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (err) {
          console.error('Error disconnecting socket:', err);
        }
        socketRef.current = null;
      }
    };
  }, [sessionId, onDisconnect]);
  
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
    if (!peerRef.current || !peerRef.current.connected) return;
    
    try {
      // Send capture command to phone
      peerRef.current.send(JSON.stringify({ type: 'capture' }));
    } catch (err) {
      console.error('Error sending capture command:', err);
      setStatus('error');
      setErrorMessage(`Error sending capture command: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
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