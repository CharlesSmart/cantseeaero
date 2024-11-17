import { Client } from "@gradio/client";
import { Profile } from '../types/Profile';

export const removeBG = async (
  selectedProfile: Profile | undefined, 
  handleUpdateProfile: (profile: Profile) => void,
  setBGRemovalLoading: (isBGRemvoalLoading: boolean) => void
) => {    
  if (!selectedProfile) return;

  setBGRemovalLoading(true);

  try {
    const client = await Client.connect("gokaygokay/Inspyrenet-Rembg");
    const result = await client.predict("/predict", { 
      input_image: selectedProfile.uploadedImage as File, 		
      output_type: "Default", 
    });

    const removedBackgroundUrl = result.data[0].url;
    const response = await fetch(removedBackgroundUrl);
    const blob = await response.blob();
    const cachedImageUrl = URL.createObjectURL(blob);
    const fileName = "cachedImage.png";
    const cachedImage = new File([blob], fileName, { type: blob.type });

    const updatedProfile = { 
      ...selectedProfile, 
      cachedImageUrl,
      cachedImage,
    };
    handleUpdateProfile(updatedProfile);
  } catch (error) {
    console.error("Error removing background:", error);
  } finally {
    setBGRemovalLoading(false);
  }
};
