import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (sessionId: string) => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'generating' | 'ready' | 'connecting' | 'connected' | 'timeout'>('generating');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Connect to signaling server with the correct path
      const newSocket = io({
        path: '/api/signaling',
        transports: ['polling', 'websocket']
      });
      socketRef.current = newSocket;
      
      newSocket.on('connect', () => {
        newSocket.emit('create-session');
      });
      
      newSocket.on('session-created', ({ sessionId }) => {
        setSessionId(sessionId);
        setStatus('ready');
        setTimeLeft(10);
      });
      
      newSocket.on('mobile-connected', () => {
        setStatus('connected');
        if (sessionId) {
          onConnected(sessionId);
        }
      });
      
      newSocket.on('session-timeout', () => {
        setStatus('timeout');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setStatus('timeout');
      });
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isOpen, onConnected, sessionId]);
  
  useEffect(() => {
    if (status === 'ready') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [status]);
  
  useEffect(() => {
    if (timeLeft === 0 && status === 'ready') {
      setStatus('timeout');
    }
  }, [timeLeft, status]);
  
  const getQRUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/mobile-camera?sessionId=${sessionId}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Phone Camera</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {status === 'generating' && (
            <div className="text-center">
              <p>Generating QR code...</p>
            </div>
          )}
          
          {status === 'ready' && sessionId && (
            <>
              <div className="mb-4 p-2 bg-white rounded-lg">
                <QRCodeSVG value={getQRUrl()} size={200} />
              </div>
              
              <p className="text-sm text-center mb-2">
                Scan this QR code with your phone to connect your camera
              </p>
              
              <div className="w-full max-w-xs">
                <Progress value={(timeLeft / 10) * 100} className="h-2" />
                <p className="text-xs text-center mt-1">
                  QR code expires in {timeLeft} seconds
                </p>
              </div>
            </>
          )}
          
          {status === 'connecting' && (
            <div className="text-center">
              <p>Connecting to your phone...</p>
            </div>
          )}
          
          {status === 'connected' && (
            <div className="text-center text-green-600">
              <p>Phone connected successfully!</p>
            </div>
          )}
          
          {status === 'timeout' && (
            <div className="text-center text-red-600">
              <p>QR code expired. Please try again.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal; 