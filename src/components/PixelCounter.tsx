import React, { useEffect } from 'react'; // useState is removed as pixelCounts is not directly used for rendering by this component anymore
import { getPixelData, countPixels, PixelCounts } from '@/utils/imageProcessing';
import { useProfileStore } from '@/store/profileStore'; // Import Zustand store

interface PixelCounterProps {
  // imageFile and onPixelCountUpdate are removed
}

const PixelCounter: React.FC<PixelCounterProps> = () => {
  const store = useProfileStore();
  const { profiles, selectedProfileId, updateProfile } = store;
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  // Determine which image to use: cached first, then uploaded
  const imageToAnalyze = selectedProfile?.cachedImage ?? selectedProfile?.uploadedImage;

  useEffect(() => {
    const analyzeImage = async () => {
      if (!selectedProfile || !imageToAnalyze) {
        // If no profile selected or no image to analyze, do nothing or clear previous counts if necessary
        // updateProfile({ ...selectedProfile, pixelCounts: null }); // Optional: clear counts
        return;
      }

      // Ensure imageToAnalyze is a File object
      if (!(imageToAnalyze instanceof File)) {
        // console.error('Image to analyze is not a File object:', imageToAnalyze);
        // Potentially handle cases where it might be a string URL if data model was different
        return;
      }

      try {
        const imageData = await getPixelData(imageToAnalyze);
        const counts = countPixels(imageData);
        // Update the profile in the Zustand store
        updateProfile({ ...selectedProfile, pixelCounts: counts });
      } catch (error: unknown) {
        console.error('Error analyzing image in PixelCounter:', {
          error: error instanceof Error ? error.message : error,
          profileId: selectedProfile.id,
          fileName: imageToAnalyze.name,
          fileType: imageToAnalyze.type,
          fileSize: imageToAnalyze.size,
        });
        // Optionally, clear pixel counts on error
        // updateProfile({ ...selectedProfile, pixelCounts: null });
      }
    };

    analyzeImage();
    // Dependency array: analyze when selected profile or its relevant image changes
  }, [selectedProfile, imageToAnalyze, updateProfile]);

  // This component no longer renders anything itself, it's purely for background processing.
  // If it were to render something, it would use pixelCounts from selectedProfile.
  return null;

};

export default PixelCounter;