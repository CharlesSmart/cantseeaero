import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer, { Instance as SimplePeerInstance } from 'simple-peer';
import { useSearchParams } from 'react-router-dom';

const MobileCameraPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<SimplePeerInstance | null>(null);
  
  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID provided');
      return;
    }
    
    // Connect to signaling server
    const socket = io();
    socketRef.current = socket;
    
    socket.on('connect', () => {
      socket.emit('join-session', { sessionId });
    });
    
    socket.on('connection-successful', async () => {
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } },
          audio: false 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Create WebRTC peer
        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream
        });
        
        peerRef.current = peer;
        
        peer.on('signal', (data) => {
          socket.emit('signal', { sessionId, signal: data });
        });
        
        peer.on('connect', () => {
          setStatus('connected');
        });
        
        peer.on('error', (err) => {
          setStatus('error');
          setErrorMessage(`Connection error: ${err.message}`);
        });
        
        socket.on('signal', ({ signal }) => {
          peer.signal(signal);
        });
        
        socket.on('peer-disconnected', () => {
          setStatus('error');
          setErrorMessage('Main application disconnected');
        });
      } catch (err) {
        setStatus('error');
        setErrorMessage(`Camera access error: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
    
    socket.on('session-not-found', () => {
      setStatus('error');
      setErrorMessage('Session not found or expired');
    });
    
    return () => {
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);
  
  const handleCapture = () => {
    if (peerRef.current && peerRef.current.connected) {
      // Send capture command through data channel
      peerRef.current.send(JSON.stringify({ type: 'capture' }));
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