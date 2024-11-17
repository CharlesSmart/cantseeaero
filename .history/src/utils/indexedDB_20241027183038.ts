// src/utils/indexedDB.ts
import { openDB } from 'idb';

const DB_NAME = 'UserProfileDB';
const STORE_NAME = 'profiles';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveProfile = async (profile: Profile) => {
  const db = await initDB();
  await db.put(STORE_NAME, profile);
};

export const getProfiles = async (): Promise<Profile[]> => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

