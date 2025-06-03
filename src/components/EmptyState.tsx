import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ImageUploader from './ImageUploader';

type EmptyStateProps = {
  onImageUpload: (file: File | null) => void;
  uploadedImage: File | null;
  onLoadDemoProfiles: () => void;
  onPhoneCameraConnected?: (sessionId: string) => void;
  onOpenCamera?: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ 
  onImageUpload, 
  uploadedImage, 
  onLoadDemoProfiles,
  onPhoneCameraConnected,
  onOpenCamera
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLoadDemoProfiles();
    }
  };

  return (
    <Card className='max-w-xs fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'>
      <CardHeader className='space-y-0 pb-2 pt-8'>
        <h2 className='text-lg font-semibold text-center leading-6'>Upload an image <br/><span className='text-muted-foreground'>to get started</span></h2>    
      </CardHeader>  
      <CardContent className='pb-0'> 
        <ImageUploader 
          className='border-none h-auto mb-6' 
          onImageUpload={onImageUpload} 
          uploadedImage={uploadedImage}
          onPhoneCameraConnected={onPhoneCameraConnected}
          onOpenCamera={onOpenCamera}
        />
        <p className='text-sm text-muted-foreground text-center'>or try an example</p>    
        <div 
          role="button"
          tabIndex={0}
          className='flex flex-row gap-2 group cursor-pointer pt-2 px-4 overflow-hidden' 
          onClick={onLoadDemoProfiles}
          onKeyDown={handleKeyDown}
          aria-label="Load demo profiles with example images"
        >
          <div className='border bg-card rounded-md -rotate-2 translate-x-6 translate-y-2 transition-all group-hover:-rotate-3 group-hover:translate-y-1 group-hover:shadow-md'><img src="/demo/demoImagePreview1.png" srcSet="/demo/demoImagePreview1.png 2x" alt="Example trainer image - first demo"  /></div>
          <div className='border bg-card rounded-md rotate-2 -translate-x-6 translate-y-2 transition-all group-hover:rotate-3 group-hover:translate-y-1 group-hover:shadow-md'><img src="/demo/demoImagePreview2.png" srcSet="/demo/demoImagePreview2.png 2x" alt="Example trainer image - second demo"  /></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;