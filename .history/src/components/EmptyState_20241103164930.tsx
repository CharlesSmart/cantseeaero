import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import ImageUploader from './ImageUploader';

interface EmptyStateProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File | null;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImageUpload, uploadedImage }) => {
  return (
    <Card>
            <CardHeader>
            <h2 className='text-lg font-semibold'>Upload an image</h2>    
            <p className='text-sm text-muted-foreground'>or try an example from below for a demo.</p>    
            </CardHeader>  
        <CardContent> 
        <ImageUploader onImageUpload={onImageUpload} uploadedImage={uploadedImage} imageUrl={''} />
      </CardContent>
    </Card>
  );
};

export default EmptyState;