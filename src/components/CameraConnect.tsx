import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { QRCodeSVG } from 'qrcode.react';
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
  const sessionIdRef = useRef<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120); // QR code expiry timer
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
        
        socket.on('session-created', ({ sessionId: newSessionId }) => {
          console.log('Session created:', newSessionId);
          sessionIdRef.current = newSessionId;
          setSessionId(newSessionId);
          setStatus('ready');
        });
        
        socket.on('mobile-connected', () => {
          console.log('Mobile device connected, using session ID:', sessionIdRef.current);
          setStatus('connecting');
          if (sessionIdRef.current) {
            // Add 1 second delay before initializing peer
            setTimeout(() => {
              console.log('Initializing peer after delay...');
              initializePeerConnection(sessionIdRef.current!);
            }, 1000);
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
      initiator: true,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
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
        videoRef.current.play().catch(console.error);
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

  const startCountdown = () => {
    setCountdownActive(true);
    setCountdown(5);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          // Countdown finished, take the photo
          setCountdownActive(false);
          handleCapture();
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 5; // Reset for next time
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setCountdownActive(false);
    setCountdown(5);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleDisconnect = () => {
    cleanup();
    onDisconnect();
  };

  const getQRUrl = () => {
    // For production
    if (process.env.NODE_ENV === 'production') {
      return `${window.location.origin}/mobile-camera?sessionId=${sessionId}`;
    }

    // For local development
      const protocol = 'https:';
      const host = import.meta.env.VITE_DEV_IP;
      const port = import.meta.env.VITE_DEV_PORT;
      return `${protocol}//${host}:${port}/mobile-camera?sessionId=${sessionId}`;

  };
  return (
    <div className="flex flex-col items-center">
      {status === 'initializing' && (
        <div className="text-center">
          <p className='text-sm text-muted-foreground mb-2'>Initializing connection...</p>
        </div>
      )}
      {/* QR Code Section */}
      {status === 'ready' && sessionId && (
        <>
        <div className="text-center">
          <QRCodeSVG value={getQRUrl()} size={200} />
          </div>
          <div>
          <div className="mt-2">
            <p className='text-sm text-muted-foreground'>QR code expires in {timeLeft} seconds</p>
            <a href={getQRUrl()} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm text-primary hover:text-blue-800 transition-colors underline text-center" aria-label="Open direct connection link in new tab">
                  Or open direct link
                </a>
          </div>
        </div>
         </>
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
          <Button
            onClick={handleRetry}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Capture Button */}
      {status === 'connected' && (
        <div className="mt-4 text-center">
          {countdownActive ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl font-bold text-blue-600 animate-pulse">
                {countdown}
              </div>
              <Button 
                onClick={cancelCountdown}
                variant="outline"
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              onClick={startCountdown}
              className="mt-4"
            >
              Take Photo
            </Button>
          )}
        </div>
      )}

      {/* Add disconnect button */}
      <hr className='w-full my-4'></hr>
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          
        >
          Cancel
        </Button>
      
    </div>
  );
};

export default CameraConnect;
