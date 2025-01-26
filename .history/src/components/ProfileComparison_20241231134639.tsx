import React, { createContext, useState, useContext } from 'react';

interface ImageContextType {
  imageUrl: string;
  setImageUrl: (url: string) => void;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const ImageProvider: React.FC = ({ children }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <ImageContext.Provider value={{ imageUrl, setImageUrl }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  return context;
};