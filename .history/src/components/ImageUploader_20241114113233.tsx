import React, { useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ImageUploaderProps {
  onImageUpload: (file: File | null) => void;
  uploadedImage: (File | null); // Add uploadedImage to props
  imageUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImage, imageUrl }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        setError('Please upload a PNG');
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
    <div className="pb-2">
      {!uploadedImage &&
        <div className='h-32 flex justify-center items-center border border-dashed rounded-lg'>
        <Button onClick={handleClick}><Upload className='w-4 h-4 mr-2'/>Upload Image</Button>
        </div>
      }
      {uploadedImage &&
        <div className='flex items-center justify-between rounded-md'>
          <div className='flex items-center gap-2'>
            <img src={imageUrl || ''} alt="Uploaded image" className="max-h-10 max-w-8 rounded-sm object-cover bg-secondary" />
            <p className='text-sm text-secondary-foreground'>{uploadedImage.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger><Edit className="w-4 h-4 text-muted-foreground" /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleClick}>Change image</DropdownMenuItem>
              <DropdownMenuItem>Delete profile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <Button variant="ghost" size="icon" onClick={handleClick} className="-mr-2 gap-2 px-2">
          <Upload className="w-4 h-4 text-muted-foreground" />
        </Button> */}
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
