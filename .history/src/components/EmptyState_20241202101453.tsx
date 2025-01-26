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
            <CardHeader className='space-y-0 pb-2'>
            <h2 className='text-lg font-semibold text-center leading-6'>Upload an image <br/><span className='text-muted-foreground'>to get started</span></h2>    
            </CardHeader>  
        <CardContent className='pb-0'> 
        <ImageUploader className='border-none h-auto mb-6' onImageUpload={onImageUpload} uploadedImage={uploadedImage} />
        <p className='text-sm text-muted-foreground text-center'>or try an example set</p>    
        <a className='flex flex-row gap-2 group cursor-pointer pt-4' onClick={onLoadDemoProfiles}>
            <div className='border bg-card rounded-md -rotate-2 translate-x-6 translate-y-2 transition-all group-hover:-rotate-3 group-hover:translate-y-1 group-hover:shadow-sm'><img src="/demo/examplepreview.png" srcSet="/demo/examplepreview@2x.png 2x" alt="Example trainer image"  /></div>
            <div className='border bg-card rounded-md rotate-2 -translate-x-6 translate-y-2 transition-all group-hover:rotate-3 group-hover:translate-y-1 group-hover:bg-gradient-to-t from-cyan-50 to-white'><img src="/demo/examplepreview.png" srcSet="/demo/examplepreview@2x.png 2x" alt="Example trainer image"  /></div>
        </a>
      </CardContent>
    </Card>
  );
};

export default EmptyState;