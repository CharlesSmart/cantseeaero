import { useState, useEffect } from 'react';
import { Profile } from '@/types/Profile';
import MeasurementTool from '@/components/MeasurementTool';
import AnalysisPanel from '@/components/AnalysisPanel';
import { PixelCounts } from '@/utils/imageProcessing';
import PixelCounter from '@/components/PixelCounter';
import { saveProfile, getProfiles, deleteProfile } from '@/utils/indexedDB';
import EmptyState from '@/components/EmptyState';
import { removeBG } from '@/utils/removeBG';
import { demoProfiles } from '@/utils/demoProfiles';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
// import CameraPreview from '@/components/CameraPreview';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CameraConnect from '@/components/CameraConnect';

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([{
    id: 1,
    uploadedImage: null,
    imageUrl: null,
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  }]);

  // Global calibration values
  const [linkedMeasurementPixels, setLinkedMeasurementPixels] = useState<number | null>(null);
  const [linkedMeasurementMm, setLinkedMeasurementMm] = useState<number | null>(null);
  const useLinkedMeasurements = true;

  // const [cameraSessionId, setCameraSessionId] = useState<string | null>(null);
  // const [showCameraPreview, setShowCameraPreview] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      const storedProfiles = await getProfiles();
    
      if (storedProfiles.length > 0){
      const profilesWithBlobUrls = storedProfiles.map(profile => {
        const uploadedImageUrlIDB = profile.uploadedImage ? URL.createObjectURL(new Blob([profile.uploadedImage])) : null;
        const cachedImageUrlIDB = profile.cachedImage ? URL.createObjectURL(new Blob([profile.cachedImage])) : null;

        // Convert blobs to File objects
        const uploadedImageFile = profile.uploadedImage ? new File([profile.uploadedImage], "uploadedImage.png", { type: "image/png" }) : null;
        const cachedImageFile = profile.cachedImage ? new File([profile.cachedImage], "cachedImage.png", { type: "image/png" }) : null;

        return {
          ...profile,
          uploadedImage: uploadedImageFile, // Store as File object
          cachedImage: cachedImageFile, // Store as File object
          imageUrl: uploadedImageUrlIDB,
          cachedImageUrl: cachedImageUrlIDB,
        };
      });

      setProfiles(profilesWithBlobUrls);
      setSelectedProfileId(profilesWithBlobUrls[0].id); // Set the first profile's id

      // Initialize global values with the first profile's values
      setLinkedMeasurementPixels(profilesWithBlobUrls[0].measurementPixels);
      setLinkedMeasurementMm(profilesWithBlobUrls[0].measurementMm);
      } else {
        // await saveProfile(profiles[0]);
      }
    };
    loadProfiles();
  }, []);


  
  const handleLoadDemoProfiles = () => {
    setProfiles(demoProfiles);
  };

  const handleAddProfile = async () => {
    const newProfile: Profile = {
      id: profiles.length + 1,
      uploadedImage: null,
      imageUrl: null,
      cachedImageUrl: null,
      cachedImage: null,
      pixelCounts: null,
      measurementPixels: selectedProfile?.measurementPixels ?? null,
      measurementMm: selectedProfile?.measurementMm ?? null
    };
    setProfiles([...profiles, newProfile]);
    setSelectedProfileId(newProfile.id);
    await saveProfile(newProfile);

  };

  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(profiles.length > 0 ? profiles[0].id : null);
  const handleSelectProfile = (id: number) => {
    setSelectedProfileId(id);
  };

  const handleUpdateProfile = async (updatedProfile: Profile) => {
    setProfiles(profiles.map(profile => 
      profile.id === updatedProfile.id ? updatedProfile : profile,
    ));
    await saveProfile(updatedProfile);
  };

  const handleDeleteProfile = async (id: number) => {
    const updatedProfiles = profiles.filter(profile => profile.id !== id);
    setProfiles(updatedProfiles);
    await deleteProfile(id);

    if (updatedProfiles.length === 0) {
      // Initialize a new default profile if no profiles are left
      const defaultProfile: Profile = {
        id: 1,
        uploadedImage: null,
        imageUrl: null,
        cachedImageUrl: null,
        cachedImage: null,
        pixelCounts: null,
        measurementPixels: null,
        measurementMm: null,
      };
      setProfiles([defaultProfile]);
      setSelectedProfileId(defaultProfile.id);
      await saveProfile(defaultProfile);
    } else {
      setSelectedProfileId(updatedProfiles[0].id);
    }
  };

  const selectedProfile = profiles.find(profile => profile.id === selectedProfileId);

  const handleImageUpload = async (file: File | null) => {
    if (selectedProfile && file) {
        const updatedProfile = { 
          ...selectedProfile, 
          uploadedImage: file, 
          imageUrl: URL.createObjectURL(file)
        };
        handleUpdateProfile(updatedProfile);
    } 
  };

  const handlePixelCountUpdate = (counts: PixelCounts) => {
    if (selectedProfile) {
      const updatedProfile = { 
        ...selectedProfile, 
        pixelCounts: counts 
      };
      handleUpdateProfile(updatedProfile);
    }
  };

  const handleRulerUpdate = (pixels: number) => {
    if (selectedProfile) {
      const updatedProfile = { 
        ...selectedProfile, 
        measurementPixels: pixels 
      };
      handleUpdateProfile(updatedProfile);

      if (useLinkedMeasurements) {
        setLinkedMeasurementPixels(pixels);
        const updatedProfiles = profiles.map(profile => ({
          ...profile,
          measurementPixels: pixels
        }));
        setProfiles(updatedProfiles);
        updatedProfiles.forEach(profile => handleUpdateProfile(profile));
      }
    }
  };

  const handleLengthUpdate = (length: number) => {
    if (selectedProfile) {
      const updatedProfile = { 
        ...selectedProfile, 
        measurementMm: length 
      };
      handleUpdateProfile(updatedProfile);

      if (useLinkedMeasurements) {
        setLinkedMeasurementMm(length);

        const updatedProfiles = profiles.map(profile => ({
          ...profile,
          measurementMm: length
        }));
        setProfiles(updatedProfiles);
        updatedProfiles.forEach(profile => handleUpdateProfile(profile));
      }
    }
  };
  
  const handleRemoveBG = () => {
    removeBG(selectedProfile, handleUpdateProfile, setBGRemovalLoading);
  };
  const [isBGRemovalLoading, setBGRemovalLoading] = useState(false);


  const imageUrlToUse = selectedProfile?.cachedImageUrl ?? selectedProfile?.imageUrl ?? '';
  const imageToUse = selectedProfile?.cachedImage ?? selectedProfile?.uploadedImage ?? null;

  const handleCameraDisconnect = () => {
    // Camera disconnect handled by CameraConnect component
  };

  const handleCameraCapture = async (imageData: string) => {
    // Convert data URL to File object
    const res = await fetch(imageData);
    const blob = await res.blob();
    const file = new File([blob], "camera-capture.png", { type: "image/png" });
    
    // Use the existing image upload handler
    handleImageUpload(file);
    
    // Hide camera preview after capture
    // setShowCameraPreview(false);
  };

  return (
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <ModeToggle />
    <div className="min-w-[100vw] min-h-screen bg-background-pattern bg-no-repeat bg-cover">
        <>
        {profiles.every(profile => profile.uploadedImage === null) &&
          <EmptyState 
          onImageUpload={handleImageUpload} 
          uploadedImage={selectedProfile?.uploadedImage as File} 
          onLoadDemoProfiles={handleLoadDemoProfiles} 
          />
        } 
        {profiles.some(profile => profile.uploadedImage !== null) &&
          <>
          {/* {showCameraPreview && ( */}
            <Card className="max-w-md mx-auto mb-4 mt-4">
              <CardHeader>
                <h2 className="text-lg font-semibold">Phone Camera Preview</h2>
              </CardHeader>
              <CardContent>
                <CameraConnect 
                  onCapture={handleCameraCapture}
                  onDisconnect={handleCameraDisconnect}
                />
              </CardContent>
            </Card>
          {/* )} */}
          <PixelCounter 
            imageFile={imageToUse as File}
            onPixelCountUpdate={handlePixelCountUpdate}
          />
          <AnalysisPanel 
            pixelCounts={selectedProfile?.pixelCounts ?? null}
            measurementPixels={useLinkedMeasurements ? linkedMeasurementPixels ?? null : selectedProfile?.measurementPixels ?? null}
            measurementMm={useLinkedMeasurements ? linkedMeasurementMm ?? null : selectedProfile?.measurementMm ?? null}
            onLengthUpdate={handleLengthUpdate}
            uploadedImage={selectedProfile?.uploadedImage as File}
            imageUrl={selectedProfile?.imageUrl ?? ''}
            handleImageUpload={handleImageUpload}
            profiles={profiles} 
            onAddProfile={handleAddProfile} 
            onSelectProfile={handleSelectProfile} 
            selectedProfileId={selectedProfileId}
            onDeleteProfile={handleDeleteProfile}
          />
          <MeasurementTool 
            imageUrl={imageUrlToUse} 
            onRulerUpdate={handleRulerUpdate}
            onRemoveBG={handleRemoveBG} // Use the new handler
            isBGRemovalLoading={isBGRemovalLoading}
            selectedProfileId={selectedProfileId}
            profiles={profiles}
          />
          </>
        }
        </>
        
    </div>
    </ThemeProvider>
  );
}

export default App;
