import React, { useState, useEffect } from 'react';
import { getPixelData, countPixels, PixelCounts } from '../utils/imageProcessing';

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
        } catch (error) {
          console.error('Error analyzing image:', error);
        }
      };
      console.log(pixelCounts)
      analyzeImage();
    }, [imageFile]);
  
    if (!pixelCounts) {
      return null;
    }

};

export default PixelCounter;