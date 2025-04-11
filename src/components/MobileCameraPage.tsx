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
  
  // Add timestamp for tracking connection duration
  const connectionStartTime = useRef(Date.now());
  
  // Move this useEffect outside of the other useEffect
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
          video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } },
          audio: false 
        });
        
        console.log('[Camera] Camera access granted:', {
          tracks: stream.getTracks().map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState
          }))
        });
        
        if (!isComponentMounted.current) {
          console.log('[Camera] Component unmounted during camera access, cleaning up');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          console.log('[Video] Attaching stream to video element');
          videoRef.current.srcObject = stream;
        }
        
        // Create WebRTC peer
        console.log('[Peer] Initializing WebRTC peer...');
        try {
          // WebRTC support check with detailed logging
          const rtcSupport = {
            RTCPeerConnection: !!window.RTCPeerConnection,
            mediaDevices: !!navigator.mediaDevices,
            getUserMedia: !!navigator.mediaDevices?.getUserMedia
          };
          console.log('[Peer] WebRTC support status:', rtcSupport);
          
          if (!window.RTCPeerConnection || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('WebRTC is not fully supported in this browser');
          }
          
          console.log('[Peer] Creating SimplePeer instance...');
          const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            stream,
            config: {
              iceServers: [
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
              ]
            }
          });
          
          console.log('[Peer] SimplePeer instance created');
          peerRef.current = peer;
          
          // Peer event listeners with enhanced logging
          peer.on('signal', (data) => {
            console.log('[Peer] Generated signal:', {
              type: data.type,
              signalType: data.type === 'offer' ? 'OFFER' : 
                         data.type === 'answer' ? 'ANSWER' : 
                         data.type === 'candidate' ? 'ICE_CANDIDATE' : 'UNKNOWN'
            });
            if (isComponentMounted.current) {
              safeEmit('signal', { sessionId, signal: data });
            }
          });
          
          peer.on('connect', () => {
            console.log('[Peer] Connection established!');
            console.log('[Peer] Connection time:', Date.now() - connectionStartTime.current, 'ms');
            if (isComponentMounted.current) {
              setStatus('connected');
            }
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
          console.error('[Peer] Initialization error:', err);
          throw err; // Re-throw to be caught by outer try-catch
        }
        
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