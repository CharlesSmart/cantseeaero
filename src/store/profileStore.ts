import { create } from 'zustand';
import { Profile } from '../types/profile';
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
      const profilesWithFileObjects = storedProfiles.map(profileFromDB => {
        // Convert ArrayBuffer back to File objects
        const uploadedImageFile = profileFromDB.uploadedImage instanceof ArrayBuffer
          ? new File([profileFromDB.uploadedImage], "uploadedImage.png", { type: "image/png" })
          : profileFromDB.uploadedImage; // Or null if it wasn't an ArrayBuffer
        const cachedImageFile = profileFromDB.cachedImage instanceof ArrayBuffer
          ? new File([profileFromDB.cachedImage], "cachedImage.png", { type: "image/png" })
          : profileFromDB.cachedImage;

        return {
          ...profileFromDB,
          uploadedImage: uploadedImageFile,
          cachedImage: cachedImageFile,
          // Recreate blob URLs if needed for immediate display, or handle in component
          imageUrl: uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : null,
          cachedImageUrl: cachedImageFile ? URL.createObjectURL(cachedImageFile) : null,
        };
      });
      set({
        profiles: profilesWithFileObjects,
        selectedProfileId: profilesWithFileObjects[0].id,
        linkedMeasurementPixels: profilesWithFileObjects[0].measurementPixels,
        linkedMeasurementMm: profilesWithFileObjects[0].measurementMm,
      });
    } else {
      // Initialize with a default profile if DB is empty
      const defaultProfile: Profile = {
        id: Date.now(), // Use Date.now() for ID
        uploadedImage: null, imageUrl: null, cachedImageUrl: null, cachedImage: null,
        pixelCounts: null, measurementPixels: null, measurementMm: null,
      };
      set({ profiles: [defaultProfile], selectedProfileId: defaultProfile.id });
      await saveProfileToDB(defaultProfile); // Save the initial default profile
    }
  },

  addProfile: async (profileData) => {
    const newProfile: Profile = {
      ...profileData,
      id: Date.now(), // ID generated here
    };
    set((state) => ({
      profiles: [...state.profiles, newProfile],
      selectedProfileId: newProfile.id, // Select the new profile
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
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      // Optionally, select another profile if the deleted one was selected
      selectedProfileId: state.selectedProfileId === id ? (state.profiles[0]?.id || null) : state.selectedProfileId,
    }));
    await deleteProfileFromDB(id);
    if (get().profiles.length === 0) {
        // If all profiles are deleted, add a default one back
        // Prepare data without ID for addProfile action
        const defaultProfileData: Omit<Profile, 'id'> = {
            uploadedImage: null, imageUrl: null, cachedImageUrl: null, cachedImage: null,
            pixelCounts: null, measurementPixels: null, measurementMm: null,
        };
        get().addProfile(defaultProfileData); // addProfile will generate the ID
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
