import React, { useState, useEffect } from 'react';
import { Profile } from './types/Profile';
import MeasurementTool from './components/MeasurementTool';
import AnalysisPanel from './components/AnalysisPanel';
import { PixelCounts } from './utils/imageProcessing';
import PixelCounter from './components/PixelCounter';
import { toWords } from 'number-to-words';
import { Client } from "@gradio/client";
import { saveProfile, getProfiles } from './utils/indexedDB';


function App() {
  const [profiles, setProfiles] = useState<Profile[]>([{
    id: 'One',
    uploadedImage: null,
    imageUrl: null,
    cachedImageUrl: null, // New property for cached image data
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  }]);

  useEffect(() => {
    const loadProfiles = async () => {
      const storedProfiles = await getProfiles();
      const profilesWithBlobUrls = storedProfiles.map(profile => {
        const uploadedImageUrl = profile.uploadedImage ? URL.createObjectURL(new Blob([profile.uploadedImage])) : null;
        const cachedImageUrl = profile.cachedImage ? URL.createObjectURL(new Blob([profile.cachedImage])) : null;

        // Convert blobs to File objects
        const uploadedImageFile = profile.uploadedImage ? new File([profile.uploadedImage], "uploadedImage.png", { type: "image/png" }) : null;
        const cachedImageFile = profile.cachedImage ? new File([profile.cachedImage], "cachedImage.png", { type: "image/png" }) : null;

        return {
          ...profile,
          uploadedImage: uploadedImageFile, // Store as File object
          cachedImage: cachedImageFile, // Store as File object
          uploadedImageUrl: uploadedImageUrl,
          cachedImageUrl: cachedImageUrl,
        };
      });
      setProfiles(profilesWithBlobUrls);

      // Check if profilesWithBlobUrls is not empty before setting selectedProfileId
      if (profilesWithBlobUrls.length > 0) {
        setSelectedProfileId(profilesWithBlobUrls[0].id);
      } else {
        setSelectedProfileId(null); // Set to null if no profiles are available
      }
    };
    loadProfiles();
  }, []);

  const handleAddProfile = async () => {
    const newProfile: Profile = {
      id: capitalize(toWords(profiles.length + 1)),
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
  const capitalize = (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || ""

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(profiles[0].id);
  const handleSelectProfile = (id: string) => {
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
      console.log("File passed to profile:", file);
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
  
  const removeBG = async () => {    
    const client = await Client.connect("gokaygokay/Inspyrenet-Rembg");
    const result = await client.predict("/predict", { 
      input_image: selectedProfile?.uploadedImage as File, 		
      output_type: "Default", 
    });
    if (selectedProfile) {
      const removedBackgroundUrl = result.data[0].url;
      const response = await fetch(removedBackgroundUrl);
      const blob = await response.blob();
      const cachedImageUrl = URL.createObjectURL(blob); // Create a local URL for the cached image
      const fileName = "cachedImage.png"; // Define a file name for the cached image
      const cachedImage = new File([blob], fileName, { type: blob.type }); // Create a File object

      const updatedProfile = { 
        ...selectedProfile, 
        cachedImageUrl, // Store the cached image data
        cachedImage, // Store the File object in cachedImage
      };
      handleUpdateProfile(updatedProfile);
    }
  };

  const imageUrlToUse = selectedProfile?.cachedImageUrl ?? selectedProfile?.imageUrl ?? '';
  const imageToUse = selectedProfile?.cachedImage ?? selectedProfile?.uploadedImage ?? null;
  // console.log("is cached image:", selectedProfile?.cachedImage);

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     e.preventDefault();
  //     // Most browsers ignore the custom message and show a generic one
  //     e.returnValue = 'Are you sure you want to leave? Your changes may not be saved.';
  //   };

  //   window.addEventListener('beforeunload', handleBeforeUnload);

  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, []);

  // useEffect(() => {
  //   return () => {
  //     profiles.forEach(profile => {
  //       if (profile.imageUrl) URL.revokeObjectURL(profile.imageUrl);
  //       if (profile.cachedImageUrl) URL.revokeObjectURL(profile.cachedImageUrl);
  //     });
  //   };
  // }, [profiles]);

  return (
    <div className="w-screen">
        <>
          {/* <ImageUploader onImageUpload={handleImageUpload} uploadedImage={selectedProfile?.uploadedImage as File} /> */}
          <PixelCounter 
            imageFile={imageToUse as File}
            onPixelCountUpdate={handlePixelCountUpdate}
          />
          <AnalysisPanel 
            pixelCounts={selectedProfile?.pixelCounts}
            measurementPixels={selectedProfile?.measurementPixels}
            measurementMm={selectedProfile?.measurementMm}
            onLengthUpdate={handleLengthUpdate}
            uploadedImage={selectedProfile?.uploadedImage as File}
            imageUrl={selectedProfile?.imageUrl ?? ''}
            handleImageUpload={handleImageUpload}
            profiles={profiles} // Pass profiles to AnalysisPanel
            onAddProfile={handleAddProfile} // Pass handleAddProfile to AnalysisPanel
            onSelectProfile={handleSelectProfile} // Pass handleSelectProfile to AnalysisPanel
            selectedProfileId={selectedProfileId}
          />
          <MeasurementTool 
            imageUrl={imageUrlToUse}// Use the cached image URL if available
            onRulerUpdate={handleRulerUpdate}
            onRemoveBG={removeBG}
          />
        </>

    </div>
  );
}

export default App;
