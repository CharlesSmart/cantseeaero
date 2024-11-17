import React from 'react';
import { Card } from '../components/ui/card';
import ImageUploader from './ImageUploader';

interface EmptyStateProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File | null;
  imageUrl: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImageUpload, uploadedImage, imageUrl }) => {
  return (
    <Card>
      <ImageUploader onImageUpload={onImageUpload} uploadedImage={uploadedImage} imageUrl={imageUrl} />
    </Card>
  );
};

export default EmptyState;