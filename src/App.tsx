import { useEffect } from 'react'; // useState removed
import { useProfileStore } from './store/profileStore'; // Import Zustand store
import { Profile } from '@/types/Profile';
// import MeasurementTool from '@/components/MeasurementTool';
// import AnalysisPanel from '@/components/AnalysisPanel';
// import { PixelCounts } from '@/utils/imageProcessing';
// import PixelCounter from '@/components/PixelCounter';
// saveProfile, getProfiles, deleteProfile removed from here
// import EmptyState from '@/components/EmptyState'; // No longer directly imported
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval'; // Import the new hook
// import { demoProfiles } from '@/utils/demoProfiles';
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
  // const setSelectedProfileId = useProfileStore((state) => state.setSelectedProfileId);
  // const updateProfile = useProfileStore((state) => state.updateProfile);
  // const deleteProfile = useProfileStore((state) => state.deleteProfile);
  // // const setLinkedMeasurements = useProfileStore((state) => state.setLinkedMeasurements); // Will be effectively replaced by new action for linked updates
  // const updateLinkedMeasurementAndAllProfiles = useProfileStore((state) => state.updateLinkedMeasurementAndAllProfiles); // New action
  // const setProfilesState = useProfileStore((state) => state.setProfiles);
  const loadProfilesFromDB = useProfileStore((state) => state.loadProfilesFromDB); // Get new action
  const { isBGRemovalLoading, triggerRemoveBackground } = useBackgroundRemoval(); // Use the hook

  const useLinkedMeasurements = true; // This can remain or be moved to store if needed

  // const [cameraSessionId, setCameraSessionId] = useState<string | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false); // Keep local UI state

  useEffect(() => {
    // Call the store action to load profiles from DB
    loadProfilesFromDB();
  }, [loadProfilesFromDB]); // Dependency array ensures this runs once on mount

  
  // const handleLoadDemoProfiles = () => {
  //   // This needs to be adapted for Zustand, potentially clearing existing profiles first
  //   // or adding demo profiles to the existing ones. For now, let's replace them.
  //   setProfilesState(demoProfiles);
  //   if (demoProfiles.length > 0) {
  //     setSelectedProfileId(demoProfiles[0].id);
  //     // Correctly update linked measurements using the new store action
  //     if (demoProfiles[0].measurementPixels) {
  //       updateLinkedMeasurementAndAllProfiles('pixels', demoProfiles[0].measurementPixels);
  //     }
  //     if (demoProfiles[0].measurementMm) {
  //       updateLinkedMeasurementAndAllProfiles('mm', demoProfiles[0].measurementMm);
  //     }
  //   }
  // };

  // const handleAddProfile = async () => {
  //   // ID generation is now removed from here.
  //   // Get the current selected profile from the store to copy measurement values
  //   const currentSelectedProfile = profiles.find(p => p.id === selectedProfileId);
  //   const newProfileData: Omit<Profile, 'id'> = { // Data without ID
  //     uploadedImage: null,
  //     imageUrl: null,
  //     cachedImageUrl: null,
  //     cachedImage: null,
  //     pixelCounts: null,
  //     measurementPixels: useLinkedMeasurements ? linkedMeasurementPixels : currentSelectedProfile?.measurementPixels ?? null,
  //     measurementMm: useLinkedMeasurements ? linkedMeasurementMm : currentSelectedProfile?.measurementMm ?? null,
  //   };
  //   addProfile(newProfileData); // Pass data without ID to store action
  // };

  // SelectedProfileId is now directly from the store
  // const handleSelectProfile = (id: number) => {
  //   setSelectedProfileId(id); // Use store action
  // };

  // const handleUpdateProfile = async (updatedProfile: Profile) => {
  //   updateProfile(updatedProfile); // Store action now handles saving to DB
  // };

  // const handleDeleteProfile = async (id: number) => {
  //   // The logic for handling empty list and selecting next profile is now in store action
  //   deleteProfile(id); // Store action now handles DB delete and subsequent logic
  // };

  const selectedProfile = profiles.find(profile => profile.id === selectedProfileId);

  // const handleImageUpload = async (file: File | null) => {
  //   if (selectedProfile && file) {
  //       const updatedProfileData = {
  //         ...selectedProfile, 
  //         uploadedImage: file, 
  //         imageUrl: URL.createObjectURL(file)
  //       };
  //       updateProfile(updatedProfileData); // Store action handles saving
  //   } 
  // };

  // const handlePixelCountUpdate = (counts: PixelCounts) => {
  //   if (selectedProfile) {
  //     const updatedProfileData = {
  //       ...selectedProfile, 
  //       pixelCounts: counts 
  //     };
  //       updateProfile(updatedProfileData); // Store action handles saving
  //   }
  // };

  // const handleRulerUpdate = (pixels: number) => {
  //   if (selectedProfile) {
  //     const updatedProfileData = {
  //       ...selectedProfile, 
  //       measurementPixels: pixels 
  //     };
  //       updateProfile(updatedProfileData); // Update and save the currently selected profile

  //     if (useLinkedMeasurements) {
  //       // Call the new store action to update linked value and all profiles
  //       updateLinkedMeasurementAndAllProfiles('pixels', pixels);
  //     }
  //   }
  // };

  // const handleLengthUpdate = (length: number) => {
  //   if (selectedProfile) {
  //     const updatedProfileData = {
  //       ...selectedProfile, 
  //       measurementMm: length 
  //     };
  //       updateProfile(updatedProfileData); // Update and save the currently selected profile

  //     if (useLinkedMeasurements) {
  //       // Call the new store action to update linked value and all profiles
  //       updateLinkedMeasurementAndAllProfiles('mm', length);
  //     }
  //   }
  // };


  const imageUrlToUse = selectedProfile?.cachedImageUrl ?? selectedProfile?.imageUrl ?? '';
  // const imageToUse = selectedProfile?.cachedImage ?? selectedProfile?.uploadedImage ?? null;

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
