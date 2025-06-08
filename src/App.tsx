import { useEffect } from 'react'; // useState removed
import { useProfileStore } from './store/profileStore'; // Import Zustand store
import { Profile } from '@/types/Profile';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval'; // Import the new hook
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { useState } from 'react'; // Keep useState for non-profile state
import EmptyStateDisplay from './components/layout/EmptyStateDisplay'; // Import new component
import Workspace from './components/layout/Workspace'; // Import new component

function App() {
  // Zustand store integration
  const profiles = useProfileStore((state) => state.profiles);
  const selectedProfileId = useProfileStore((state) => state.selectedProfileId);
  const linkedMeasurementPixels = useProfileStore((state) => state.linkedMeasurementPixels);
  const linkedMeasurementMm = useProfileStore((state) => state.linkedMeasurementMm);
  const addProfile = useProfileStore((state) => state.addProfile);
  const loadProfilesFromDB = useProfileStore((state) => state.loadProfilesFromDB); // Get new action
  const { isBGRemovalLoading, triggerRemoveBackground } = useBackgroundRemoval(); // Use the hook

  const useLinkedMeasurements = true; // This can remain or be moved to store if needed

  // const [cameraSessionId, setCameraSessionId] = useState<string | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false); // Keep local UI state

  useEffect(() => {
    // Call the store action to load profiles from DB
    loadProfilesFromDB();
  }, [loadProfilesFromDB]); // Dependency array ensures this runs once on mount


  const selectedProfile = profiles.find(profile => profile.id === selectedProfileId);

  const imageUrlToUse = selectedProfile?.cachedImageUrl ?? selectedProfile?.imageUrl ?? '';

  const handleCameraConnect = () => {
    setShowCameraPreview(true);
  };

  const handleCameraDisconnect = () => {
    setShowCameraPreview(false);
  };

  const handleCameraCapture = async (imageData: string) => {
    const res = await fetch(imageData);
    const blob = await res.blob();
    const file = new File([blob], "camera-capture.png", { type: "image/png" });

    // ID generation is now removed from here.
    // Get the current selected profile from the store to copy measurement values
    const currentSelectedProfile = profiles.find(p => p.id === selectedProfileId);
    const newProfileData: Omit<Profile, 'id'> = { // Data without ID
      displayId: profiles.length + 1,
      uploadedImage: file,
      imageUrl: URL.createObjectURL(file),
      cachedImageUrl: null,
      cachedImage: null,
      pixelCounts: null,
      measurementPixels: useLinkedMeasurements ? linkedMeasurementPixels : currentSelectedProfile?.measurementPixels ?? null,
      measurementMm: useLinkedMeasurements ? linkedMeasurementMm : currentSelectedProfile?.measurementMm ?? null,
    };

    addProfile(newProfileData); // Pass data without ID to store action
  };

  return (
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <ModeToggle />
      <div className="min-w-[100vw] min-h-screen bg-background-pattern bg-no-repeat bg-cover">
        {profiles.length === 0 ? (
          <EmptyStateDisplay onOpenCamera={handleCameraConnect}/>
        ) : (
          <Workspace
            showCameraPreview={showCameraPreview}
            onCameraCapture={handleCameraCapture}
            onCameraDisconnect={handleCameraDisconnect}
            onOpenCamera={handleCameraConnect}
            imageUrlToUse={imageUrlToUse}
            isBGRemovalLoading={isBGRemovalLoading}
            onRemoveBG={triggerRemoveBackground}
            selectedProfilePixelCounts={selectedProfile?.pixelCounts ?? null}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
