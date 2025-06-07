import { openDB } from 'idb';
import { Profile } from '../types/Profile';

const DB_NAME = 'UserProfileDB';
const STORE_NAME = 'profiles';

export const initDB = async () => {
  return openDB(DB_NAME, 3, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveProfile = async (profile: Profile) => {
  try {
    const db = await initDB();
    // Create a "clean" profile object for saving, excluding temporary URLs.
    const profileToSave = {
      id: profile.id,
      displayId: profile.displayId,
      measurementPixels: profile.measurementPixels,
      measurementMm: profile.measurementMm,
      pixelCounts: profile.pixelCounts,
      // Convert File objects to ArrayBuffers for storage.
      uploadedImage: profile.uploadedImage ? await profile.uploadedImage.arrayBuffer() : null,
      cachedImage: profile.cachedImage ? await profile.cachedImage.arrayBuffer() : null,
    };

    await db.put(STORE_NAME, profileToSave);
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
};

export const getProfiles = async (): Promise<Profile[]> => {
  try {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
  } catch (error) {
    console.error("Failed to get profiles:", error);
    return [];
  }
};

export const deleteProfile = async (id: number) => {
  try {
    const db = await initDB();
    
    // Find the exact profile to ensure ID matching
    const allProfilesTx = db.transaction(STORE_NAME, 'readonly');
    const allProfilesStore = allProfilesTx.objectStore(STORE_NAME);
    const allProfiles = await allProfilesStore.getAll();
    await allProfilesTx.done;
    
    const targetProfile = allProfiles.find(p => p.id === id);
    
    if (!targetProfile) {
      console.warn('Profile with ID', id, 'not found in database');
      return;
    }
    // Delete using the exact ID from the database
    const deleteTx = db.transaction(STORE_NAME, 'readwrite');
    const deleteStore = deleteTx.objectStore(STORE_NAME);
    await deleteStore.delete(targetProfile.id);
    await deleteTx.done;
    
  } catch (error) {
    console.error('Failed to delete profile:', error);
    throw error;
  }
};
