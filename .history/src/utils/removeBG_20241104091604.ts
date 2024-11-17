import { Client } from "@gradio/client";
import { Profile } from '../types/Profile';

export const removeBG = async (selectedProfile: Profile | undefined, handleUpdateProfile: (profile: Profile) => void) => {    
  if (!selectedProfile) return;

  const client = await Client.connect("gokaygokay/Inspyrenet-Rembg");
  const result = await client.predict("/predict", { 
    input_image: selectedProfile.uploadedImage as File, 		
    output_type: "Default", 
  });

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
};
