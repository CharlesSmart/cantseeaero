import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import ImageUploader from './ImageUploader';

type EmptyStateProps = {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File | null;
  onLoadDemoProfiles: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ onImageUpload, uploadedImage, onLoadDemoProfiles}) => {
  return (
    <Card className='max-w-xs fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'>
            <CardHeader className='space-y-0'>
            <h2 className='text-lg font-semibold'>Upload an image</h2>    
            <p className='text-sm text-muted-foreground'>or try an example from below for a demo.</p>    
            </CardHeader>  
        <CardContent> 
        <ImageUploader onImageUpload={onImageUpload} uploadedImage={uploadedImage} />
        <hr />
        <a className='flex flex-row gap-2 group cursor-pointer' onClick={onLoadDemoProfiles}>
            <div className='border bg-card rounded-md -rotate-2 translate-x-4 transition-all group-hover:-rotate-6'><img src="/demo/examplepreview.png" srcSet="/demo/examplepreview@2x.png 2x" alt="Example trainer image"  /></div>
            <div className='border bg-card rounded-md rotate-2 -translate-x-4 transition-all group-hover:rotate-6'><img src="/demo/examplepreview.png" srcSet="/demo/examplepreview@2x.png 2x" alt="Example trainer image"  /></div>
        </a>
      </CardContent>
    </Card>
  );
};

export default EmptyState;