import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CameraConnect from '@/components/CameraConnect';


interface CameraPreviewCardProps {
  onCapture: (imageData: string) => void;
  onDisconnect: () => void;
}

const CameraPreviewCard: React.FC<CameraPreviewCardProps> = ({ onCapture, onDisconnect }) => {
  return (
    <Card className="max-w-md mx-auto mb-4 mt-4 absolute left-1/2 -translate-x-1/2 max-h-[85vh] flex flex-col">
      <CardHeader className='items-center flex-shrink-0'>
        <h2 className="text-lg font-semibold">Connect phone camera</h2>
        <p className='text-sm text-center'>Use your phone as a remote camera.</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <CameraConnect
          onCapture={onCapture}
          onDisconnect={onDisconnect}
        />
      </CardContent>
    </Card>
  );
};

export default CameraPreviewCard;
