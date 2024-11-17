import { useState, useEffect } from 'react';
import { Profile } from './types/Profile';
import MeasurementTool from './components/MeasurementTool';
import AnalysisPanel from './components/AnalysisPanel';
import { PixelCounts } from './utils/imageProcessing';
import PixelCounter from './components/PixelCounter';
import { saveProfile, getProfiles } from './utils/indexedDB';
import EmptyState from './components/EmptyState';
import { Progress } from "@/components/ui/progress"
import { removeBG } from './utils/removeBG';
import { demoProfiles } from './utils/demoProfiles';


function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

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
      } else {
        await saveProfile(profiles[0]);
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
      cachedImageUrl: null, // New property for cached image data
      cachedImage: null,
      pixelCounts: null,
      measurementPixels: null,
      measurementMm: null,
    };
    setProfiles([...profiles, newProfile]);
    setSelectedProfileId(newProfile.id);
    await saveProfile(newProfile);

  };

  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(profiles[0].id);
  const handleSelectProfile = (id: number) => {
    setSelectedProfileId(id);
  };

  const handleUpdateProfile = async (updatedProfile: Profile) => {
    setProfiles(profiles.map(profile => 
      profile.id === updatedProfile.id ? updatedProfile : profile,
    ));
    await saveProfile(updatedProfile);

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
    };
  }

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
    }
  };

  const handleLengthUpdate = (length: number) => {
    if (selectedProfile) {
      const updatedProfile = { 
        ...selectedProfile, 
        measurementMm: length 
      };
      handleUpdateProfile(updatedProfile);
    }
  };
  
  const handleRemoveBG = () => {
    removeBG(selectedProfile, handleUpdateProfile, setBGRemovalLoading);
  };
  const [isBGRemovalLoading, setBGRemovalLoading] = useState(false);


  const imageUrlToUse = selectedProfile?.cachedImageUrl ?? selectedProfile?.imageUrl ?? '';
  const imageToUse = selectedProfile?.cachedImage ?? selectedProfile?.uploadedImage ?? null;

  //Work out how to remove profiles on unload? to avoid memory leak
  // useEffect(() => {
  //   return () => {
  //     profiles.forEach(profile => {
  //       if (profile.imageUrl) URL.revokeObjectURL(profile.imageUrl);
  //       if (profile.cachedImageUrl) URL.revokeObjectURL(profile.cachedImageUrl);
  //     });
  //   };
  // }, [profiles]);

  return (
    <div className="min-w-screen min-h-screen bg-background-pattern bg-no-repeat bg-cover">
        <>
        {profiles.every(profile => !profile.uploadedImage) && // Check if all profiles have no uploaded image
        <EmptyState 
        onImageUpload={handleImageUpload} 
        uploadedImage={selectedProfile?.uploadedImage as File} 
        onLoadDemoProfiles={handleLoadDemoProfiles} // Add this prop
        />
        } 
        {!profiles.every(profile => !profile.uploadedImage) &&
          <>
          <PixelCounter 
            imageFile={imageToUse as File}
            onPixelCountUpdate={handlePixelCountUpdate}
          />
          <AnalysisPanel 
            pixelCounts={selectedProfile?.pixelCounts ?? null}
            measurementPixels={selectedProfile?.measurementPixels ?? null}
            measurementMm={selectedProfile?.measurementMm ?? null}
            onLengthUpdate={handleLengthUpdate}
            uploadedImage={selectedProfile?.uploadedImage as File}
            imageUrl={selectedProfile?.imageUrl ?? ''}
            handleImageUpload={handleImageUpload}
            profiles={profiles} // Pass profiles to AnalysisPanel
            onAddProfile={handleAddProfile} // Pass handleAddProfile to AnalysisPanel
            onSelectProfile={handleSelectProfile} // Pass handleSelectProfile to AnalysisPanel
            selectedProfileId={selectedProfileId}
          />
          {isBGRemovalLoading && <Progress indeterminate={isBGRemovalLoading} />}
          <MeasurementTool 
            imageUrl={imageUrlToUse} // Use the cached image URL if available
            onRulerUpdate={handleRulerUpdate}
            onRemoveBG={handleRemoveBG} // Use the new handler
            isBGRemovalLoading={isBGRemovalLoading}
          />
          </>
        }
        </>
        
    </div>
  );
}

export default App;
