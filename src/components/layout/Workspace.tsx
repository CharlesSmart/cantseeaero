import React from 'react';
import PixelCounter from '@/components/PixelCounter';
import AnalysisPanel from '@/components/AnalysisPanel';
import MeasurementTool from '@/components/MeasurementTool';
import CameraPreviewCard from '@/components/CameraPreviewCard'; // Assuming this path is correct
import { PixelCounts } from '@/utils/imageProcessing';

interface WorkspaceProps {
  showCameraPreview: boolean;
  onCameraCapture: (imageData: string) => void;
  onCameraDisconnect: () => void;
  onOpenCamera: () => void; // For AnalysisPanel to trigger showing camera preview
  imageUrlToUse: string;
  isBGRemovalLoading: boolean;
  onRemoveBG: () => void;
  selectedProfilePixelCounts: PixelCounts | null;
}

const Workspace: React.FC<WorkspaceProps> = ({
  showCameraPreview,
  onCameraCapture,
  onCameraDisconnect,
  onOpenCamera,
  imageUrlToUse,
  isBGRemovalLoading,
  onRemoveBG,
  selectedProfilePixelCounts,
}) => {
  return (
    <>
      {showCameraPreview && (
        <CameraPreviewCard
          onCapture={onCameraCapture}
          onDisconnect={onCameraDisconnect}
        />
      )}
      <PixelCounter />
      {/* PixelCounter uses store directly */}
      <AnalysisPanel
        pixelCounts={selectedProfilePixelCounts}
        onOpenCamera={onOpenCamera} // To toggle showCameraPreview state in App.tsx
        // Other props for AnalysisPanel are now taken from store or not needed
      />
      <MeasurementTool
        imageUrl={imageUrlToUse}
        onRemoveBG={onRemoveBG}
        isBGRemovalLoading={isBGRemovalLoading}
        // Other props for MeasurementTool are from store or not needed
      />
    </>
  );
};

export default Workspace;
