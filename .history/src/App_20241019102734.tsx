import React, { useState } from 'react';
import { Profile } from './types/Profile';
import ImageUploader from './components/ImageUploader';
import MeasurementTool from './components/MeasurementTool';
import AnalysisPanel from './components/AnalysisPanel';
import { PixelCounts } from './utils/imageProcessing';
import PixelCounter from './components/PixelCounter';

import { Client } from "@gradio/client";


function App() {
  const [profiles, setProfiles] = useState<Profile[]>([{
    id: 'Position 1',
    uploadedImage: null,
    imageUrl: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null, // New property for cached image data
    cachedImage: null,
  }]);

  const handleAddProfile = () => {
    console.log("Adding profile", profiles.length + 1);
    const newProfile: Profile = {
      id: 'Position ' + (profiles.length + 1),
      uploadedImage: null,
      imageUrl: null,
      pixelCounts: null,
      measurementPixels: null,
      measurementMm: null,
      cachedImage: null, // New property for cached image data
    };
    setProfiles([...profiles, newProfile]);
    setSelectedProfileId(newProfile.id);
  };
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(profiles[0].id);
  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    console.log("Selected profile ID:", id);
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    setProfiles(profiles.map(profile => 
      profile.id === updatedProfile.id ? updatedProfile : profile
    ));
    // console.log("handleUpdateProfile");

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
      console.log("handlePixelCountUpdate");
    }
  };

  const handleRulerUpdate = (pixels: number) => {
    if (selectedProfile) {
      const updatedProfile = { 
        ...selectedProfile, 
        measurementPixels: pixels 
      };
      handleUpdateProfile(updatedProfile);
      console.log("handleRulerUpdate");
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
      // console.log("from removeBG:", imageUrl);
      handleUpdateProfile(updatedProfile);
    }
  };

  const imageUrlToUse = selectedProfile?.cachedImageUrl ?? selectedProfile?.imageUrl ?? '';
  const imageToUse = selectedProfile?.cachedImage ?? selectedProfile?.uploadedImage ?? null;
  // console.log("is cached image:", selectedProfile?.cachedImage);
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
            // onPixelCountUpdate={handlePixelCountUpdate}
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
