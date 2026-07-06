// 🎬 Video Cache - IndexedDB bilan video fayllarni saqlash
// Refresh qilgandan keyin ham ishlaydi!

const DB_NAME = 'VideoCache';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

// IndexedDB ni ochish
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('videoUrl', 'videoUrl', { unique: false });
        objectStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };
  });
};

// Video saqlash
export const saveVideoToCache = async (videoUrl, originalName, file) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const videoData = {
      id: videoUrl, // video_url ni ID qilib ishlatamiz
      videoUrl,
      originalName,
      blob: file, // File obyekti to'g'ridan-to'g'ri saqlanadi
      uploadedAt: new Date().toISOString(),
    };

    await store.put(videoData);
    console.log('💾 Video cache ga saqlandi:', videoUrl);
    return true;
  } catch (error) {
    console.error('❌ Video saqlashda xato:', error);
    return false;
  }
};

// Video olish
export const getVideoFromCache = async (videoUrl) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(videoUrl);
      request.onsuccess = () => {
        if (request.result) {
          console.log('✅ Video cache dan olindi:', videoUrl);
          resolve(request.result);
        } else {
          console.log('⚠️ Video cache da yo\'q:', videoUrl);
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Video olishda xato:', error);
    return null;
  }
};

// Barcha videolarni olish
export const getAllVideosFromCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log('📦 Cache dan barcha videolar:', request.result.length, 'ta');
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Videolarni olishda xato:', error);
    return [];
  }
};

// Video o'chirish
export const deleteVideoFromCache = async (videoUrl) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await store.delete(videoUrl);
    console.log('🗑️ Video cache dan o\'chirildi:', videoUrl);
    return true;
  } catch (error) {
    console.error('❌ Video o\'chirishda xato:', error);
    return false;
  }
};

// Barcha cache ni tozalash
export const clearVideoCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await store.clear();
    console.log('🗑️ Barcha cache tozalandi');
    return true;
  } catch (error) {
    console.error('❌ Cache tozalashda xato:', error);
    return false;
  }
};
