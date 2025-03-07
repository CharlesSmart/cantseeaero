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
    
    socket.on('connect', () => {
      if (isComponentMounted.current) {
        safeEmit('join-session', { sessionId });
      }
    });
    
    socket.on('connection-successful', async () => {
      if (!isComponentMounted.current) return;
      
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } },
          audio: false 
        });
        
        if (!isComponentMounted.current) {
          // Clean up stream if component unmounted during getUserMedia
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Create WebRTC peer
        let peer: SimplePeer.Instance;
        try {
          // Check if required browser APIs are available
          if (!window.RTCPeerConnection || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('WebRTC is not fully supported in this browser');
          }
          
          // Ensure stream is valid before creating peer
          if (!stream || !stream.active || stream.getTracks().length === 0) {
            throw new Error('Camera stream is not available or has no tracks');
          }
          
          // Wrap peer creation in try-catch with more specific error handling
          try {
            peer = new SimplePeer({
              initiator: true,
              trickle: false,
              stream,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                ]
              },
              sdpTransform: (sdp) => {
                // Ensure we're using a compatible video codec
                return sdp.replace(/VP8/g, 'H264');
              }
            });
          } catch (peerError: unknown) {
            console.error('Error creating peer:', peerError);
            // Add detailed error inspection
            if (peerError instanceof Error) {
              console.error('Error stack:', peerError.stack);
              console.error('Error properties:', {
                name: peerError.name,
                message: peerError.message,
              });
            }
            throw new Error(`Failed to create peer: ${peerError instanceof Error ? peerError.message : String(peerError)}`);
          }
          
          // Verify peer was created successfully
          if (!peer || typeof peer.signal !== 'function') {
            throw new Error('Peer was created but is invalid');
          }
          
          peerRef.current = peer;
        } catch (err) {
          console.error('Peer initialization error:', err);
          setStatus('error');
          setErrorMessage(`Peer initialization error: ${err instanceof Error ? err.message : String(err)}`);
          
          // Clean up stream on peer initialization failure
          if (stream && stream.active) {
            stream.getTracks().forEach(track => track.stop());
          }
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
        
        peer.on('connect', () => {
          if (isComponentMounted.current) {
            setStatus('connected');
          }
        });
        
        peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (isComponentMounted.current) {
            setStatus('error');
            setErrorMessage(`Connection error: ${err.message}`);
          }
        });
        
        socket.on('signal', ({ signal }) => {
          if (signal && isComponentMounted.current) {
            safeSignal(signal);
          }
        });
        
        socket.on('peer-disconnected', () => {
          if (isComponentMounted.current) {
            setStatus('error');
            setErrorMessage('Main application disconnected');
          }
        });

        const addLog = (message: string) => {
          if (isComponentMounted.current) {
            setErrorMessage(prev => `${prev}\n${message}`);
          }
        };

        peer.on('iceCandidate', (candidate) => {
          addLog(`ICE Candidate: ${JSON.stringify(candidate)}`);
        });

        peer.on('iceStateChange', (state) => {
          addLog(`ICE State: ${state}`);
        });
      } catch (err) {
        console.error('Camera access error:', err);
        if (isComponentMounted.current) {
          setStatus('error');
          setErrorMessage(`Camera access error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });
    
    socket.on('session-not-found', () => {
      if (isComponentMounted.current) {
        setStatus('error');
        setErrorMessage('Session not found or expired');
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