import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import ImageUploader from './ImageUploader';

interface EmptyStateProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImageUpload, uploadedImage }) => {
  return (
    <Card className='max-w-xs fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'>
            <CardHeader className='space-y-0'>
            <h2 className='text-lg font-semibold'>Upload an image</h2>    
            <p className='text-sm text-muted-foreground'>or try an example from below for a demo.</p>    
            </CardHeader>  
        <CardContent> 
        <ImageUploader onImageUpload={onImageUpload} uploadedImage={uploadedImage} imageUrl={''} />
        <div className='flex flex-row gap-2'>
            <img className='w-1/3' src="src/assets/examplepreview.png" srcSet="src/assets/examplepreview@2x.png 2x" alt="Example trainer image"  />
            <img className='w-1/3' src="src/assets/examplepreview.png" srcSet="src/assets/examplepreview@2x.png 2x" alt="Example trainer image"  />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;