export const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ProductDraftsDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveDraft = async (key: string, data: any) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    const req = store.put(data, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getDraft = async (key: string) => {
  const db = await initDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction('drafts', 'readonly');
    const store = tx.objectStore('drafts');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const deleteDraft = async (key: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};
