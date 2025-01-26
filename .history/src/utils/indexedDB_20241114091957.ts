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
  const db = await initDB();
  // Convert File to Blob if necessary
  const imageBlob = profile.uploadedImage ? await profile.uploadedImage.arrayBuffer() : null;
  const cachedImageBlob = profile.cachedImage ? await profile.cachedImage.arrayBuffer() : null;
  const profileToSave = {
    ...profile,
    uploadedImage: imageBlob,
    cachedImage: cachedImageBlob,
  };
  await db.put(STORE_NAME, profileToSave);
};

export const getProfiles = async (): Promise<Profile[]> => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};
