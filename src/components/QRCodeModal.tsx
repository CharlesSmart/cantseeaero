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
  const [status, setStatus] = useState<'generating' | 'ready' | 'connecting' | 'connected' | 'timeout' | 'error'>('generating');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 QRCodeModal opened, connecting to signaling server');
      
      // Try different Socket.IO connection paths
      const connectToSocketIO = () => {
        try {
          // Disconnect previous socket if it exists
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
          
          // Determine which connection path to try based on the attempt number
          const useLegacyPath = connectionAttempt % 2 === 1;
          const path = useLegacyPath ? '/socket.io' : '/api/signaling';
          
          console.log(`🔍 Attempting connection with path: ${path} (attempt ${connectionAttempt + 1})`);
          
          const newSocket = io({
            path,
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 20000
          });
          
          socketRef.current = newSocket;
          
          console.log('🔍 Socket.IO instance created');
          
          newSocket.on('connect', () => {
            console.log(`✅ Connected to signaling server using path: ${path}`);
            newSocket.emit('create-session');
          });
          
          newSocket.on('session-created', ({ sessionId }) => {
            console.log('✅ Session created:', sessionId);
            setSessionId(sessionId);
            setStatus('ready');
            setTimeLeft(10);
          });
          
          newSocket.on('mobile-connected', () => {
            console.log('✅ Mobile device connected');
            setStatus('connected');
            if (sessionId) {
              onConnected(sessionId);
            }
          });
          
          newSocket.on('session-timeout', () => {
            console.log('⏱️ Session timed out');
            setStatus('timeout');
          });
          
          newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            
            // Try the other connection path if we haven't exceeded max attempts
            if (connectionAttempt < 3) {
              console.log(`🔍 Connection failed, trying alternative path...`);
              setConnectionAttempt(prev => prev + 1);
            } else {
              setStatus('error');
              setErrorDetails(`Connection error: ${error.message}`);
            }
          });
          
          newSocket.on('connect_timeout', (timeout) => {
            console.error('❌ Socket connection timeout:', timeout);
            
            // Try the other connection path if we haven't exceeded max attempts
            if (connectionAttempt < 3) {
              console.log(`🔍 Connection timed out, trying alternative path...`);
              setConnectionAttempt(prev => prev + 1);
            } else {
              setStatus('error');
              setErrorDetails('Connection timed out');
            }
          });
          
          newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            setStatus('error');
            setErrorDetails(`Socket error: ${error.message || 'Unknown error'}`);
          });
          
          newSocket.on('disconnect', (reason) => {
            console.log('🔍 Disconnected from signaling server:', reason);
            if (reason === 'io server disconnect') {
              // the disconnection was initiated by the server, reconnect manually
              newSocket.connect();
            }
          });
          
          newSocket.on('reconnect', (attemptNumber) => {
            console.log('✅ Reconnected to signaling server after', attemptNumber, 'attempts');
          });
          
          newSocket.on('reconnect_error', (error) => {
            console.error('❌ Reconnection error:', error);
          });
          
          newSocket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect');
            
            // Try the other connection path if we haven't exceeded max attempts
            if (connectionAttempt < 3) {
              console.log(`🔍 Reconnection failed, trying alternative path...`);
              setConnectionAttempt(prev => prev + 1);
            } else {
              setStatus('error');
              setErrorDetails('Failed to reconnect to server');
            }
          });
          
          return () => {
            console.log('🔍 Cleaning up socket connection');
            newSocket.disconnect();
          };
        } catch (error) {
          console.error('❌ Error creating Socket.IO instance:', error);
          
          // Try the other connection path if we haven't exceeded max attempts
          if (connectionAttempt < 3) {
            console.log(`🔍 Socket creation failed, trying alternative path...`);
            setConnectionAttempt(prev => prev + 1);
          } else {
            setStatus('error');
            setErrorDetails(`Error creating connection: ${error instanceof Error ? error.message : String(error)}`);
          }
          
          return undefined;
        }
      };
      
      const cleanup = connectToSocketIO();
      return cleanup;
    }
  }, [isOpen, onConnected, sessionId, connectionAttempt]);
  
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
  
  const handleRetry = () => {
    console.log('🔍 Retrying connection');
    setStatus('generating');
    setErrorDetails(null);
    setConnectionAttempt(0);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
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
              {connectionAttempt > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Connection attempt {connectionAttempt + 1}...
                </p>
              )}
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
              <button 
                onClick={handleRetry}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center text-red-600">
              <p>Connection error</p>
              {errorDetails && (
                <p className="text-sm mt-1">{errorDetails}</p>
              )}
              <button 
                onClick={handleRetry}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal; 