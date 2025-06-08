import { create } from 'zustand';
import { Profile } from '../types/Profile';
import {
  saveProfile as saveProfileToDB,
  getProfiles as getProfilesFromDB,
  deleteProfile as deleteProfileFromDB
} from '../utils/indexedDB';
import { countPixels, getPixelData } from '@/utils/imageProcessing';

interface ProfileState {
  profiles: Profile[];
  selectedProfileId: number | null;
  linkedMeasurementPixels: number | null;
  linkedMeasurementMm: number | null;
  loadProfilesFromDB: () => Promise<void>;
  addProfile: (profileData: Omit<Profile, 'id'>) => Promise<void>; // Changed parameter type
  setSelectedProfileId: (id: number | null) => void;
  updateProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;
  setLinkedMeasurements: (pixels: number | null, mm: number | null) => void;
  updateLinkedMeasurementAndAllProfiles: (type: 'pixels' | 'mm', value: number) => Promise<void>;
  setProfiles: (profiles: Profile[]) => void;
  saveTimeout: NodeJS.Timeout | null;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  selectedProfileId: null,
  linkedMeasurementPixels: null,
  linkedMeasurementMm: null,
  saveTimeout: null,

  loadProfilesFromDB: async () => {
    const storedProfiles = await getProfilesFromDB();
    if (storedProfiles.length > 0) {
      const profilesWithFileObjects = storedProfiles.map((profileFromDB, index) => {
        // Convert ArrayBuffer back to File objects
        const uploadedImageFile = profileFromDB.uploadedImage instanceof ArrayBuffer
          ? new File([profileFromDB.uploadedImage], "uploadedImage.png", { type: "image/png" })
          : profileFromDB.uploadedImage;
        const cachedImageFile = profileFromDB.cachedImage instanceof ArrayBuffer
          ? new File([profileFromDB.cachedImage], "cachedImage.png", { type: "image/png" })
          : profileFromDB.cachedImage;

        return {
          ...profileFromDB,
          uploadedImage: uploadedImageFile,
          cachedImage: cachedImageFile,
          imageUrl: uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : null,
          cachedImageUrl: cachedImageFile ? URL.createObjectURL(cachedImageFile) : null,
          // Fix displayId assignment - use index + 1 for profiles without displayId
          displayId: profileFromDB.displayId || (index + 1),
        };
      });

      // Use the first profile's measurements as the baseline for linked measurements
      const firstProfile = profilesWithFileObjects[0];
      
      set({
        profiles: profilesWithFileObjects,
        selectedProfileId: firstProfile.id,
        linkedMeasurementPixels: firstProfile.measurementPixels,
        linkedMeasurementMm: firstProfile.measurementMm,
      });
    } 
  },

  addProfile: async (profileData) => {
    // Generate human-readable display ID
    const existingDisplayIds = get().profiles.map(p => p.displayId || 0);
    const nextDisplayId = existingDisplayIds.length > 0 ? Math.max(...existingDisplayIds) + 1 : 1;
    
    const newProfile: Profile = {
      ...profileData,
      id: Date.now(), // Technical ID - always unique
      displayId: nextDisplayId, // Human readable ID for UI
    };
    
    set((state) => ({
      profiles: [...state.profiles, newProfile],
      selectedProfileId: newProfile.id,
    }));
    await saveProfileToDB(newProfile);
  },

  setSelectedProfileId: (id) => set({ selectedProfileId: id }),

  updateProfile: async (profile) => {
    const { profiles } = get();
    const oldProfile = profiles.find(p => p.id === profile.id);
    const newProfileData = { ...profile };

    if (newProfileData.cachedImage && newProfileData.cachedImage instanceof File && oldProfile?.cachedImage !== newProfileData.cachedImage) {
      const imageToPixels = await getPixelData(newProfileData.cachedImage);
      const newPixelCounts = await countPixels(imageToPixels);
      newProfileData.pixelCounts = newPixelCounts;

      if (oldProfile?.cachedImageUrl) {
        URL.revokeObjectURL(oldProfile.cachedImageUrl);
      }
      newProfileData.cachedImageUrl = URL.createObjectURL(newProfileData.cachedImage);
    }

    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === newProfileData.id ? (newProfileData as Profile) : p)),
    }));
    await saveProfileToDB(newProfileData as Profile);
  },

  deleteProfile: async (id) => {
    set((state) => {
      const newProfiles = state.profiles.filter((p) => p.id !== id);
      const newSelectedId = state.selectedProfileId === id 
        ? (newProfiles[0]?.id || null) 
        : state.selectedProfileId;

      return {
        profiles: newProfiles,
        selectedProfileId: newSelectedId,
      };
    });

    try {
      await deleteProfileFromDB(id);
    } catch (error) {
      console.error('❌ Failed to delete from IndexedDB:', error);
    }
  },

  setLinkedMeasurements: (pixels, mm) =>
    set({ linkedMeasurementPixels: pixels, linkedMeasurementMm: mm }),

  updateLinkedMeasurementAndAllProfiles: async (type, value) => {
    const currentProfiles = get().profiles;
    const updatedProfiles = currentProfiles.map(profile => ({
      ...profile,
      ...(type === 'pixels' ? { measurementPixels: value } : { measurementMm: value }),
    }));

    // Update UI immediately
    if (type === 'pixels') {
      set({ profiles: updatedProfiles, linkedMeasurementPixels: value });
    } else {
      set({ profiles: updatedProfiles, linkedMeasurementMm: value });
    }

    // Debounce the DB writes
    const currentTimeout = get().saveTimeout;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    
    const timeoutId = setTimeout(async () => {
      for (const profile of updatedProfiles) {
        await saveProfileToDB(profile);
      }
      set({ saveTimeout: null });
    }, 500); // 500ms debounce
    
    set({ saveTimeout: timeoutId });
  },

  setProfiles: (profiles) => set({ profiles }), // Kept for potential direct use, e.g. demo profiles
}));
