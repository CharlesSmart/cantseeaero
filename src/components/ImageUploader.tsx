import React, { useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import classNames from 'classnames'; // Import classnames utility
import PhoneCameraButton from './PhoneCameraButton';


interface ImageUploaderProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: (File | null); // Add uploadedImage to props
  className?: string;
  onPhoneCameraConnected?: (sessionId: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  uploadedImage, 
  className,
  onPhoneCameraConnected 
}) => {
  const [error, setError] = useState<string | null>(null);
  const errorId = "image-upload-error";
  const inputId = "image-upload-input";

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
        <div 
          className={classNames('h-32 mt-2 flex justify-center items-center border border-dashed rounded-lg', className)}
          role="region"
          aria-labelledby={inputId}
        >
          <div className="flex space-x-2">
            <Button 
              onClick={handleClick}
              aria-controls={inputId}
              aria-haspopup="dialog"
            >
              <Upload className='w-4 h-4 mr-2' aria-hidden="true" />
              Upload Image
            </Button>
            
            {onPhoneCameraConnected && (
              <PhoneCameraButton onCapture={(imageData) => {
                // Convert base64 to File and call onImageUpload
                fetch(imageData)
                  .then(res => res.blob())
                  .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    onImageUpload(file);
                  });
              }} />
            )}
          </div>
        </div>
      }
      <Input
        id={inputId}
        name="imageUpload"
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        ref={hiddenFileInput}
        className="hidden file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : "false"}
        aria-label="Upload image file (JPG or PNG)"
      />
      {error && (
        <Alert 
          variant="destructive"
          id={errorId}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default ImageUploader;
