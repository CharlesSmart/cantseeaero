import { useEffect } from 'react';
import { useProfileStore } from '@/store/profileStore';
import { Profile } from '@/types/Profile';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { useState } from 'react';
import EmptyStateDisplay from '@/components/layout/EmptyStateDisplay';
import Workspace from '@/components/layout/Workspace';

function AppPage() {
  // Zustand store integration
  const profiles = useProfileStore((state) => state.profiles);
  const selectedProfileId = useProfileStore((state) => state.selectedProfileId);
  const linkedMeasurementPixels = useProfileStore((state) => state.linkedMeasurementPixels);
  const linkedMeasurementMm = useProfileStore((state) => state.linkedMeasurementMm);
  const addProfile = useProfileStore((state) => state.addProfile);
  const loadProfilesFromDB = useProfileStore((state) => state.loadProfilesFromDB);
  const { isBGRemovalLoading, triggerRemoveBackground } = useBackgroundRemoval();

  const useLinkedMeasurements = true;

  const [showCameraPreview, setShowCameraPreview] = useState(false);

  useEffect(() => {
    loadProfilesFromDB();
  }, [loadProfilesFromDB]);

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

    const currentSelectedProfile = profiles.find(p => p.id === selectedProfileId);
    const newProfileData: Omit<Profile, 'id'> = {
      displayId: profiles.length + 1,
      uploadedImage: file,
      imageUrl: URL.createObjectURL(file),
      cachedImageUrl: null,
      cachedImage: null,
      pixelCounts: null,
      measurementPixels: useLinkedMeasurements ? linkedMeasurementPixels : currentSelectedProfile?.measurementPixels ?? null,
      measurementMm: useLinkedMeasurements ? linkedMeasurementMm : currentSelectedProfile?.measurementMm ?? null,
    };

    addProfile(newProfileData);
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

export default AppPage;

