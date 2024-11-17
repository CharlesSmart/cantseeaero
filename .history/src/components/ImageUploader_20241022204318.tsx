import React, { useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { AlertCircle, EditIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  uploadedImage: (File); // Add uploadedImage to props
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImage }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        setError('Please upload a PNG');
        setPreviewUrl(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  };
  const hiddenFileInput = useRef(null);

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  return (
    <div className="space-y-4">
      {!uploadedImage &&
        <div className='h-32 flex justify-center items-center border border-dashed rounded-lg'>
        <Button onClick={handleClick}>Upload Image</Button>
        </div>
      }
      {uploadedImage &&
        <div className='flex items-center justify-between'>
        <p className='text-sm text-secondary-foreground'>{uploadedImage.name}</p>
        <button onClick={handleClick} className="flex items-center gap-2 text-sm text-secondary-foreground font-medium hover:underline">
          Edit
          <EditIcon className="w-4 h-4" />
        </button>
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
      {/* {previewUrl && (
        <div className="mt-4">
          <img src={previewUrl} alt="Uploaded image" className="max-w-full h-auto rounded-lg shadow-md" />
        </div>
      )} */}
    </div>
  );
};

export default ImageUploader;
