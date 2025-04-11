import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CameraConnect from './CameraConnect';

interface PhoneCameraButtonProps {
  onCapture: (imageData: string) => void;
}

const PhoneCameraButton: React.FC<PhoneCameraButtonProps> = ({ 
  onCapture 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  const handleDisconnect = () => {
    handleCloseDialog();
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        variant="outline"
        className="flex items-center"
        aria-label="Connect phone camera"
      >
        <Smartphone className="w-4 h-4 mr-2" aria-hidden="true" />
        Phone Camera
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <CameraConnect 
            onCapture={(imageData) => {
              onCapture(imageData);
              // Optionally close the dialog after capture
              // setIsDialogOpen(false);
            }}
            onDisconnect={handleDisconnect}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhoneCameraButton; 