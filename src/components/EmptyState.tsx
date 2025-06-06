import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ImageUploader from './ImageUploader';
import { useProfileStore } from '@/store/profileStore'; // Import Zustand store
import { demoProfiles } from '@/utils/demoProfiles'; // Import demo profiles
import { Profile } from '@/types/Profile'; // Import Profile type

type EmptyStateProps = {
  // onImageUpload, uploadedImage, onLoadDemoProfiles are removed
  onPhoneCameraConnected?: (sessionId: string) => void; // Keep if ImageUploader needs it from App
  onOpenCamera?: () => void; // Keep if ImageUploader needs it from App
};

const EmptyState: React.FC<EmptyStateProps> = ({ 
  onPhoneCameraConnected,
  onOpenCamera
}) => {
  const store = useProfileStore();
  const {
    profiles,
    selectedProfileId,
    updateProfile,
    setProfiles: setProfilesState, // Alias to avoid conflict if any
    setSelectedProfileId,
    setLinkedMeasurements,
    addProfile // For initializing a default profile if needed
  } = store;

  // Attempt to find the selected profile, or use the first profile if none is selected,
  // or ensure a default profile exists for ImageUploader.
  let currentProfile = profiles.find(p => p.id === selectedProfileId);
  if (!currentProfile && profiles.length > 0) {
    currentProfile = profiles[0];
    // setSelectedProfileId(profiles[0].id); // Optionally select the first one if none selected
  } else if (!currentProfile && profiles.length === 0) {
    // If no profiles exist, ImageUploader might need a dummy or new profile context.
    // This logic depends on how ImageUploader is meant to behave in a true empty state.
    // For now, we assume ImageUploader can handle `uploadedImage={null}`.
    // Or, we can add a default profile here.
    // Example: if (!currentProfile) addProfile({id: Date.now(), ...other default fields});
    // This part needs careful consideration based on app flow.
  }


  const handleImageUploadDirect = (file: File | null) => {
    if (currentProfile && file) {
      const updatedProfile = {
        ...currentProfile,
        uploadedImage: file,
        imageUrl: URL.createObjectURL(file),
        cachedImage: null,
        cachedImageUrl: null,
      };
      updateProfile(updatedProfile);
    } else if (!currentProfile && file) {
      // If no profile exists, create one
      const newProfile: Profile = {
        id: Date.now(), // Simple ID generation
        displayId: 1,
        uploadedImage: file,
        imageUrl: URL.createObjectURL(file),
        cachedImageUrl: null,
        cachedImage: null,
        pixelCounts: null,
        measurementPixels: null,
        measurementMm: null,
      };
      addProfile(newProfile);
      setSelectedProfileId(newProfile.id);
    }
  };

  const handleLoadDemoProfilesDirect = () => {
    setProfilesState(demoProfiles);
    if (demoProfiles.length > 0) {
      setSelectedProfileId(demoProfiles[0].id);
      setLinkedMeasurements(demoProfiles[0].measurementPixels, demoProfiles[0].measurementMm);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLoadDemoProfilesDirect();
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
          onImageUpload={handleImageUploadDirect}
          uploadedImage={currentProfile?.uploadedImage ?? null}
          onPhoneCameraConnected={onPhoneCameraConnected} // Pass through
          onOpenCamera={onOpenCamera} // Pass through
        />
        <p className='text-sm text-muted-foreground text-center'>or try an example</p>    
        <div 
          role="button"
          tabIndex={0}
          className='flex flex-row gap-2 group cursor-pointer pt-2 px-4 overflow-hidden' 
          onClick={handleLoadDemoProfilesDirect}
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