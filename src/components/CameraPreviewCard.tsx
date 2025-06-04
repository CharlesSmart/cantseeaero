import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CameraConnect from '@/components/CameraConnect';

interface CameraPreviewCardProps {
  onCapture: (imageData: string) => void;
  onDisconnect: () => void;
}

const CameraPreviewCard: React.FC<CameraPreviewCardProps> = ({ onCapture, onDisconnect }) => {
  return (
    <Card className="max-w-md mx-auto mb-4 mt-4">
      <CardHeader>
        <h2 className="text-lg font-semibold">Phone Camera Preview</h2>
      </CardHeader>
      <CardContent>
        <CameraConnect
          onCapture={onCapture}
          onDisconnect={onDisconnect}
        />
      </CardContent>
    </Card>
  );
};

export default CameraPreviewCard;
