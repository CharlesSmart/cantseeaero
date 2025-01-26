import React, { useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import classNames from 'classnames'; // Import classnames utility


interface ImageUploaderProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: (File | null); // Add uploadedImage to props
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImage, className }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        setError('Please upload a JPG/PNG');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setError(null);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  };
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  return (
    <div>
      {!uploadedImage &&
        <div className={classNames('h-32 mt-2 flex justify-center items-center border border-dashed rounded-lg', className)}>
        <Button onClick={handleClick}><Upload className='w-4 h-4 mr-2'/>Upload Image</Button>
        </div>
      }
      <Input
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        ref={hiddenFileInput}
        className="hidden file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default ImageUploader;
