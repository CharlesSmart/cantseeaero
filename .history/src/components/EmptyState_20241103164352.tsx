import React from 'react';
import { Card } from '../components/ui/card';
import ImageUploader from './ImageUploader';

interface EmptyStateProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File | null;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImageUpload, uploadedImage }) => {
  return (
    <Card>
        <CardHeader>Upload an image</CardHeader>
        <p>or try an example from below for a demo.</p>
      <ImageUploader onImageUpload={onImageUpload} uploadedImage={uploadedImage} imageUrl={''} />
    </Card>
  );
};

export default EmptyState;