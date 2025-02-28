import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import SimplePeer, { Instance as SimplePeerInstance } from 'simple-peer';
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
    
    // Create WebRTC peer
    const peer = new SimplePeer({
      initiator: false,
      trickle: false
    });
    
    peerRef.current = peer;
    
    peer.on('signal', (data) => {
      socket.emit('signal', { sessionId, signal: data });
    });
    
    peer.on('stream', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('connected');
      }
    });
    
    peer.on('data', (data) => {
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
      setStatus('error');
      setErrorMessage(`Connection error: ${err.message}`);
    });
    
    socket.on('signal', ({ signal }) => {
      peer.signal(signal);
    });
    
    socket.on('peer-disconnected', () => {
      setStatus('error');
      setErrorMessage('Phone disconnected');
      onDisconnect();
    });
    
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, onDisconnect]);
  
  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        onCapture(imageData);
      }
    }
  };
  
  const handleCaptureClick = () => {
    if (peerRef.current && peerRef.current.connected) {
      // Send capture command to phone
      peerRef.current.send(JSON.stringify({ type: 'capture' }));
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