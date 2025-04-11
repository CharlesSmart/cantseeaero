import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from "@/components/ui/progress"
import { Button } from '@/components/ui/button';

interface CameraConnectProps {
  onCapture: (imageData: string) => void;
  onDisconnect: () => void;
}

type ConnectionStatus = 
  | 'initializing'    // Initial state
  | 'ready'          // QR code ready to scan
  | 'connecting'     // Phone is connecting
  | 'connected'      // Connection established
  | 'timeout'        // QR code expired
  | 'error';         // Any error state

const CameraConnect: React.FC<CameraConnectProps> = ({ onCapture, onDisconnect }) => {
  const [status, setStatus] = useState<ConnectionStatus>('initializing');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120); // QR code expiry timer
  
  // Refs
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isComponentMounted = useRef<boolean>(true);

  useEffect(() => {
    // Initialize socket connection
    const initializeConnection = () => {
      try {
        const socket = io('https://cantseeaero-signalling-server.onrender.com', {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          timeout: 20000
        });
        
        socketRef.current = socket;
        
        // Socket event handlers
        socket.on('connect', () => {
          console.log('Socket connected, creating session');
          socket.emit('create-session');
        });
        
        socket.on('session-created', ({ sessionId }) => {
            console.log('Session created:', sessionId);  // Add this log
          setSessionId(sessionId);
          setStatus('ready');
        });
        
        socket.on('mobile-connected', () => {
          console.log('Mobile device connected, using session ID:', sessionId);
          setStatus('connecting');
          if (sessionId) {
            initializePeerConnection(sessionId);
          } else {
            console.error('No session ID available when mobile connected');
            setStatus('error');
            setErrorMessage('Connection failed - no session ID');
          }
        });
        
        socket.on('signal', ({ signal }) => {
          console.log('Desktop received signal:', signal);
          peerRef.current?.signal(signal);
        });
        
        // ... other socket handlers
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect to server');
      }
    };
    
    initializeConnection();
    return () => cleanup();
  }, []);

  // Timer for QR code expiry
  useEffect(() => {
    if (status === 'ready' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStatus('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [status, timeLeft]);

  const initializePeerConnection = (currentSessionId: string) => {
    console.log('Initializing peer connection...', { sessionId: currentSessionId, socketRef: !!socketRef.current });
    if (!currentSessionId || !socketRef.current) return;
    
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      config: {
        iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });
    
    peerRef.current = peer;
    
    // Peer event handlers
    peer.on('signal', data => {
      console.log('Desktop sending signal:', data);
      socketRef.current?.emit('signal', { sessionId: currentSessionId, signal: data });
    });
    
    peer.on('connect', () => {
      console.log('WebRTC connection established');
    });
    
    peer.on('stream', stream => {
      if (videoRef.current && isComponentMounted.current) {
        videoRef.current.srcObject = stream;
        setStatus('connected');
      }
    });
    
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setStatus('error');
      setErrorMessage('WebRTC connection failed');
    });
    
    // ... other peer handlers
  };

  const cleanup = () => {
    isComponentMounted.current = false;
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleRetry = () => {
    cleanup();
    setStatus('initializing');
    setSessionId(null);
    setErrorMessage(null);
    setTimeLeft(120);
    initializePeerConnection(sessionId || '');
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      onCapture(imageData);
    }
  };

  const handleDisconnect = () => {
    cleanup();
    onDisconnect();
  };

  const getQRUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/mobile-camera?sessionId=${sessionId}`;
  };
  return (
    <div className="flex flex-col items-center">
      {/* QR Code Section */}
      {status === 'ready' && sessionId && (
        <div className="text-center">
          <QRCodeSVG 
            value={getQRUrl()}
            size={200}
          />
          <a
                  href={getQRUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm text-blue-600 hover:text-blue-800 transition-colors underline text-center"
                  aria-label="Open direct connection link in new tab"
                >
                  Or open direct link
                </a>
          <div className="mt-2">
            <Progress value={(timeLeft / 120) * 100} />
            <p>QR code expires in {timeLeft} seconds</p>
          </div>
        </div>
      )}

      {/* Camera Preview Section */}
      {(status === 'connecting' || status === 'connected') && (
        <div className="relative w-full max-w-md">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg shadow-lg"
          />
          {status === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white">Connecting to camera...</p>
            </div>
          )}
        </div>
      )}

      {/* Error/Timeout States */}
      {(status === 'error' || status === 'timeout') && (
        <div className="text-center text-red-600">
          <p>{status === 'timeout' ? 'QR code expired' : errorMessage}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Capture Button */}
      {status === 'connected' && (
        <Button 
          onClick={handleCapture}
          className="mt-4"
        >
          Take Photo
        </Button>
      )}

      {/* Add disconnect button */}
      {status === 'connected' && (
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          className="mt-2"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
};

export default CameraConnect;
