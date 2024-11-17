import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import ImageUploader from './ImageUploader';

interface EmptyStateProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File | null;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImageUpload, uploadedImage }) => {
  return (
    <Card>
        <CardContent>
        <h3>Upload an image</h3>
        <p>or try an example from below for a demo.</p>
      <ImageUploader onImageUpload={onImageUpload} uploadedImage={uploadedImage} imageUrl={''} />
      </CardContent>
    </Card>
  );
};

export default EmptyState;