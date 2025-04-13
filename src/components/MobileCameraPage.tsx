import React, { useEffect, useRef, useState } from 'react';
import global from 'global'
import * as process from "process";
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { useSearchParams } from 'react-router-dom';


global.process = process;

const MobileCameraPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const isComponentMounted = useRef<boolean>(true); // Track component mount state
  
  // Log status changes
  useEffect(() => {
    console.log('[Status] Changed to:', status, errorMessage ? `(${errorMessage})` : '');
  }, [status, errorMessage]);

  useEffect(() => {
    console.log('[MobileCameraPage] Component mounted. Session ID:', sessionId);
    console.log('[MobileCameraPage] Initial status:', status);

    if (!sessionId) {
      console.error('[MobileCameraPage] No sessionId provided in URL');
      setStatus('error');
      setErrorMessage('No session ID provided');
      return;
    }
    
    // Connect to signaling server
    let socket: Socket;
    try {
      console.log('[Socket] Attempting to connect to signaling server...');
      socket = io('https://cantseeaero-signalling-server.onrender.com', {
        transports: ['polling', 'websocket']
      });
      socketRef.current = socket;
      console.log('[Socket] Socket instance created');
    } catch (err) {
      console.error('[Socket] Initialization error:', err);
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
    
    socket.on('connect', () => {
      console.log('[Socket] Connected successfully');
      console.log('[Socket] Joining session:', sessionId);
      if (isComponentMounted.current) {
        safeEmit('join-session', { sessionId });
      }
    });
    
    socket.on('connection-successful', async () => {
      console.log('[Socket] Received connection-successful event');
      if (!isComponentMounted.current) {
        console.log('[Socket] Component unmounted, ignoring connection-successful');
        return;
      }
      
      try {
        console.log('[Camera] Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 }, // Reduced from 4096 to more reasonable resolution
            height: { ideal: 1080 }  // Reduced from 2160 to more reasonable resolution
          },
          audio: false 
        });
        
        console.log('[Camera] Camera access granted:', {
          tracks: stream.getTracks().map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
            constraints: t.getConstraints()
          })),
          streamActive: stream.active
        });
        
        if (!isComponentMounted.current) {
          console.log('[Camera] Component unmounted during camera access, cleaning up');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Verify stream is valid
        if (!stream.active || stream.getVideoTracks().length === 0) {
          throw new Error('Camera stream is not active or has no video tracks');
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          console.log('[Video] Attaching stream to video element');
          videoRef.current.srcObject = stream;
          // Add loadedmetadata listener to verify video dimensions
          videoRef.current.onloadedmetadata = () => {
            console.log('[Video] Video metadata loaded:', {
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight
            });
          };
        }
        
        // Create WebRTC peer with enhanced logging
        console.log('[Peer] Creating SimplePeer instance with stream...');
        const peer = new SimplePeer({
          initiator: true,
          trickle: true,
          stream: stream,
          // config: {
          //   iceServers: [
          //     { urls: 'stun:freestun.net:3478' },
          //     // { urls: 'stun:stun2.l.google.com:19302' }
          //   ]
          // }
        });

        console.log('[Peer] SimplePeer instance created, verifying stream attachment');
        // Verify stream was attached to peer
        const peerConnection = (peer as SimplePeer.Instance & { _pc: RTCPeerConnection })._pc;
        const senders = peerConnection?.getSenders();
        console.log('[Peer] RTCPeerConnection senders:', senders?.length || 0);

        peer.on('connect', () => {
          console.log('[Peer] Connection established, verifying stream state:', {
            streamActive: stream.active,
            trackCount: stream.getTracks().length,
            trackStates: stream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState
            }))
          });
        });
        
        peer.on('error', (err) => {
          console.error('[Peer] Connection error:', err);
          if (isComponentMounted.current) {
            setStatus('error');
            setErrorMessage(`Connection error: ${err.message}`);
          }
        });
        
        // Additional peer debugging events
        peer.on('iceStateChange', (state) => {
          console.log('[Peer] ICE connection state changed:', state);
        });
        
        peer.on('negotiationNeeded', () => {
          console.log('[Peer] Negotiation needed');
        });
        
        peer.on('close', () => {
          console.log('[Peer] Connection closed');
        });
        
        // Socket signal handling
        socket.on('signal', ({ signal }) => {
          console.log('[Socket] Received signal from desktop:', {
            type: signal.type,
            signalType: signal.type === 'offer' ? 'OFFER' : 
                       signal.type === 'answer' ? 'ANSWER' : 
                       signal.type === 'candidate' ? 'ICE_CANDIDATE' : 'UNKNOWN'
          });
          if (signal && isComponentMounted.current) {
            try {
              peer.signal(signal);
            } catch (err) {
              console.error('[Peer] Error processing received signal:', err);
            }
          }
        });
        
      } catch (err) {
        console.error('[Setup] Error during setup:', err);
        if (isComponentMounted.current) {
          setStatus('error');
          setErrorMessage(`Setup error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });
    
    socket.on('session-not-found', () => {
      console.log('[Socket] Session not found:', sessionId);
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage('Session not found or expired');
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage(`Connection error: ${error.message}`);
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage(`Socket disconnected: ${reason}`);
      }
    });

    return () => {
      // Mark component as unmounted
      isComponentMounted.current = false;
      
      // Clean up
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (err) {
          console.error('Error stopping tracks:', err);
        }
      }
      
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
  }, [sessionId]);
  
  const handleCapture = () => {
    if (peerRef.current && peerRef.current.connected) {
      try {
        // Send capture command through data channel
        peerRef.current.send(JSON.stringify({ type: 'capture' }));
      } catch (err) {
        console.error('Error sending capture command:', err);
        setStatus('error');
        setErrorMessage(`Error sending capture command: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-white text-2xl mb-4">Phone Camera</h1>
      
      {status === 'connecting' && (
        <div className="text-white">Connecting to main application...</div>
      )}
      
      {status === 'error' && (
        <div className="text-red-500 mb-4">{errorMessage}</div>
      )}
      
      <div className="relative w-full max-w-md">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg shadow-lg"
        />
        
        {status === 'connected' && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={handleCapture}
              className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
              aria-label="Take photo"
            >
              <div className="bg-black w-14 h-14 rounded-full"></div>
            </button>
          </div>
        )}
      </div>
      
      {status === 'connected' && (
        <div className="text-white mt-4">
          Connected to main application
        </div>
      )}
    </div>
  );
};

export default MobileCameraPage; 