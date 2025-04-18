import React, { useState, useEffect } from 'react';
import { getPixelData, countPixels, PixelCounts } from '@/utils/imageProcessing';

interface PixelCounterProps {
    imageFile: File;
    onPixelCountUpdate: (counts: PixelCounts) => void;
  }
  
  const PixelCounter: React.FC<PixelCounterProps> = ({ imageFile, onPixelCountUpdate }) => {
    const [pixelCounts, setPixelCounts] = useState<PixelCounts | null>(null);
    useEffect(() => {
      const analyzeImage = async () => {
        try {
          if (!imageFile) {
            setPixelCounts(null);
            return;
          }
          if (!(imageFile instanceof File)) {
            throw new Error('Invalid file provided');
          }
          const imageData = await getPixelData(imageFile);
          const counts = countPixels(imageData);
          setPixelCounts(counts);
          onPixelCountUpdate(counts);
        } catch (error: unknown) {
          console.error('Error analyzing image:', {
            error: error instanceof Error ? error.message : error,
            fileName: imageFile.name,
            fileType: imageFile.type,
            fileSize: imageFile.size,
          });
        }
      };
      analyzeImage();
    }, [imageFile]);
  
    if (!pixelCounts) {
      return null;
    }

};

export default PixelCounter;