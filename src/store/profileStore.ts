import { create } from 'zustand';
import { Profile } from '../types/Profile';
import {
  saveProfile as saveProfileToDB,
  getProfiles as getProfilesFromDB,
  deleteProfile as deleteProfileFromDB
} from '../utils/indexedDB';

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
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  selectedProfileId: null,
  linkedMeasurementPixels: null,
  linkedMeasurementMm: null,

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
    } else {
      // Initialize with a default profile if DB is empty
      // const defaultProfile: Profile = {
      //   id: Date.now(),
      //   displayId: 1, // First profile starts at 1
      //   uploadedImage: null, imageUrl: null, cachedImageUrl: null, cachedImage: null,
      //   pixelCounts: null, measurementPixels: null, measurementMm: null,
      // };
      // set({ profiles: [defaultProfile], selectedProfileId: defaultProfile.id });
      // await saveProfileToDB(defaultProfile); // Save the initial default profile
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
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === profile.id ? profile : p)),
    }));
    await saveProfileToDB(profile);
  },

  deleteProfile: async (id) => {
    console.log('🗑️ DELETE PROFILE CALLED with ID:', id);
    console.log('📋 Current profiles before delete:', get().profiles.map(p => ({ id: p.id, displayId: p.displayId })));
    
    set((state) => {
      const newProfiles = state.profiles.filter((p) => p.id !== id);
      const newSelectedId = state.selectedProfileId === id 
        ? (newProfiles[0]?.id || null) 
        : state.selectedProfileId;

      console.log('📋 Profiles after filter:', newProfiles.map(p => ({ id: p.id, displayId: p.displayId })));
      console.log('🎯 New selected ID:', newSelectedId);

      return {
        profiles: newProfiles,
        selectedProfileId: newSelectedId,
      };
    });

    try {
      console.log('💾 Attempting to delete from IndexedDB, ID:', id);
      await deleteProfileFromDB(id);
      console.log('✅ Successfully deleted from IndexedDB');
    } catch (error) {
      console.error('❌ Failed to delete from IndexedDB:', error);
    }

    console.log('📊 Final profiles count:', get().profiles.length);
  },

  setLinkedMeasurements: (pixels, mm) =>
    set({ linkedMeasurementPixels: pixels, linkedMeasurementMm: mm }),

  updateLinkedMeasurementAndAllProfiles: async (type, value) => {
    const currentProfiles = get().profiles;
    const updatedProfiles = currentProfiles.map(profile => ({
      ...profile,
      ...(type === 'pixels' ? { measurementPixels: value } : { measurementMm: value }),
    }));

    if (type === 'pixels') {
      set({ profiles: updatedProfiles, linkedMeasurementPixels: value });
    } else {
      set({ profiles: updatedProfiles, linkedMeasurementMm: value });
    }

    // Persist all updated profiles to IndexedDB
    // This still calls saveProfileToDB for each, but it's now centralized
    // and follows a single state update.
    for (const profile of updatedProfiles) {
      await saveProfileToDB(profile);
    }
  },

  setProfiles: (profiles) => set({ profiles }), // Kept for potential direct use, e.g. demo profiles
}));
