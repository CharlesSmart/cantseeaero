import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

interface PhoneCameraButtonProps {
  onCameraConnected: (sessionId: string) => void;
}

const PhoneCameraButton: React.FC<PhoneCameraButtonProps> = ({ onCameraConnected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleConnected = (sessionId: string) => {
    onCameraConnected(sessionId);
    // Keep modal open for a moment to show success message
    setTimeout(() => {
      setIsModalOpen(false);
    }, 1500);
  };
  
  return (
    <>
      <Button 
        onClick={handleOpenModal}
        variant="outline"
        className="flex items-center"
        aria-label="Connect phone camera"
      >
        <Smartphone className="w-4 h-4 mr-2" aria-hidden="true" />
        Phone Camera
      </Button>
      
      <QRCodeModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onConnected={handleConnected} 
      />
    </>
  );
};

export default PhoneCameraButton; 