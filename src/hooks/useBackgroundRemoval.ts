import { useState } from 'react';
import { useProfileStore } from '@/store/profileStore';
import { removeBG } from '@/utils/removeBG';
import { Profile } from '@/types/Profile';

export const useBackgroundRemoval = () => {
  const { updateProfile, profiles, selectedProfileId } = useProfileStore();
  const [isBGRemovalLoading, setBGRemovalLoading] = useState(false);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const triggerRemoveBackground = async () => {
    if (!selectedProfile) {
      console.error("No profile selected for background removal.");
      return;
    }

    // Type assertion to ensure selectedProfile is not undefined for removeBG
    const profileToRemoveBgFrom = selectedProfile as Profile;

    setBGRemovalLoading(true);
    try {
      // removeBG expects a callback that will receive the updated profile.
      // This callback should then use the store's updateProfile action.
      // The store's updateProfile action already handles saving to IndexedDB.
      await removeBG(profileToRemoveBgFrom, updateProfile, setBGRemovalLoading);
      // setBGRemovalLoading(false); // removeBG utility now calls setBGRemovalLoading(false) on completion/error
    } catch (error) {
      console.error("Error during background removal:", error);
      setBGRemovalLoading(false); // Ensure loading is stopped on error
    }
  };

  return {
    isBGRemovalLoading,
    triggerRemoveBackground,
  };
};
