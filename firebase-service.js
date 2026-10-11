/**
 * FIREBASE CLIENT INTEGRATION FOR THE NOTICEBOARD
 * Handles Firestore Real-Time Database, Authentication, Site Settings & Admin Security
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  getDocFromServer
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

let app = null;
let db = null;
let auth = null;
let isConfigured = false;

// Admin emails
const ADMIN_EMAILS = ['123.aarushsharma@gmail.com'];

// Error handler specified by skill
export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function initFirebase() {
  try {
    const res = await fetch('/firebase-applet-config.json');
    if (!res.ok) throw new Error('Could not load firebase-applet-config.json');
    const config = await res.json();
    
    app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId || undefined);
    auth = getAuth(app);
    isConfigured = true;

    // Test connection as required by skill
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (testErr) {
      if (testErr instanceof Error && testErr.message.includes('the client is offline')) {
        console.warn("Please check your Firebase configuration.");
      }
    }

    return { app, db, auth };
  } catch (err) {
    console.warn('Firebase init warning (falling back to local state):', err);
    return null;
  }
}

export function getDb() { return db; }
export function getFirebaseAuth() { return auth; }
export function isFirebaseReady() { return isConfigured && db !== null; }

// Secure Admin Authentication
export function validateAdminCredentials(username, password) {
  if (username === 'admin234' && password === 'admin121') {
    sessionStorage.setItem('admin_auth_session', 'authenticated_admin_key');
    return true;
  }
  return false;
}

export function isAdminSessionActive() {
  const token = sessionStorage.getItem('admin_auth_session');
  if (token === 'authenticated_admin_key') return true;
  if (auth?.currentUser && auth.currentUser.email && ADMIN_EMAILS.includes(auth.currentUser.email.toLowerCase())) {
    return true;
  }
  return false;
}

export function logoutAdminSession() {
  sessionStorage.removeItem('admin_auth_session');
}

export function isUserAdmin(user) {
  if (isAdminSessionActive()) return true;
  if (!user) return false;
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  return false;
}

// Google Sign-In
export async function loginWithGoogle() {
  if (!auth) throw new Error('Auth not initialized');
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

// Sign Out
export async function logoutUser() {
  if (!auth) return;
  return await fbSignOut(auth);
}

// Fetch all opportunities from Firestore (with automatic seeding from posts.json if empty)
export async function getOpportunities() {
  if (!isFirebaseReady()) return null;
  const path = 'opportunities';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      const seeded = await seedDefaultOpportunities();
      return seeded;
    }
    const list = [];
    snapshot.forEach(d => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, 'list', path);
    return null;
  }
}

// Seed initial data if Firestore is empty
async function seedDefaultOpportunities() {
  try {
    const res = await fetch('/posts.json');
    if (!res.ok) return [];
    const posts = await res.json();
    for (const post of posts) {
      const docId = String(post.id);
      await setDoc(doc(db, 'opportunities', docId), {
        title: post.title,
        category: post.category,
        date: post.date,
        deadline: post.deadline,
        description: post.description,
        link: post.link,
        tag: post.tag || 'General',
        daily: Boolean(post.daily),
        image: post.image || '',
        updatedAt: new Date().toISOString()
      });
    }
    return posts;
  } catch (err) {
    console.warn('Could not seed opportunities:', err);
    return [];
  }
}

// Save / Update Opportunity
export async function saveOpportunityToFirestore(oppData, existingId = null) {
  if (!isFirebaseReady()) throw new Error('Database not ready');
  const path = 'opportunities';
  try {
    const dataToSave = {
      title: oppData.title,
      category: oppData.category,
      date: oppData.date || new Date().toISOString().split('T')[0],
      deadline: oppData.deadline,
      description: oppData.description,
      link: oppData.link,
      tag: oppData.tag || 'General',
      daily: Boolean(oppData.daily),
      image: oppData.image || '',
      updatedAt: new Date().toISOString()
    };

    if (existingId) {
      await updateDoc(doc(db, path, String(existingId)), dataToSave);
      return { id: String(existingId), ...dataToSave };
    } else {
      const newRef = await addDoc(collection(db, path), dataToSave);
      return { id: newRef.id, ...dataToSave };
    }
  } catch (err) {
    handleFirestoreError(err, existingId ? 'update' : 'create', path);
    throw err;
  }
}

// Delete Opportunity
export async function deleteOpportunityFromFirestore(id) {
  if (!isFirebaseReady()) throw new Error('Database not ready');
  const path = `opportunities/${id}`;
  try {
    await deleteDoc(doc(db, 'opportunities', String(id)));
    return true;
  } catch (err) {
    handleFirestoreError(err, 'delete', path);
    throw err;
  }
}

// Global Site Settings (Ticker, Metrics, Announcement)
export async function getSiteSettings() {
  if (!isFirebaseReady()) {
    try {
      const cached = localStorage.getItem('site_settings');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  }
  const path = 'settings/global';
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      localStorage.setItem('site_settings', JSON.stringify(data));
      return data;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, 'get', path);
    return null;
  }
}

export async function saveSiteSettings(settingsData) {
  localStorage.setItem('site_settings', JSON.stringify(settingsData));
  if (!isFirebaseReady()) return settingsData;
  const path = 'settings/global';
  try {
    await setDoc(doc(db, 'settings', 'global'), {
      ...settingsData,
      updatedAt: new Date().toISOString()
    });
    return settingsData;
  } catch (err) {
    handleFirestoreError(err, 'write', path);
    return settingsData;
  }
}

// User Bookmarks (Saved items)
export async function getUserBookmarks(userId) {
  if (!isFirebaseReady() || !userId) return [];
  const path = `users/${userId}/bookmarks`;
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'bookmarks'));
    const ids = [];
    snapshot.forEach(d => {
      ids.push(d.id);
    });
    return ids;
  } catch (err) {
    handleFirestoreError(err, 'list', path);
    return [];
  }
}

export async function toggleBookmarkInFirestore(userId, opportunityId, isSaved) {
  if (!isFirebaseReady() || !userId) return;
  const path = `users/${userId}/bookmarks/${opportunityId}`;
  try {
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', String(opportunityId));
    if (isSaved) {
      await setDoc(bookmarkRef, {
        opportunityId: String(opportunityId),
        userId,
        savedAt: new Date().toISOString()
      });
    } else {
      await deleteDoc(bookmarkRef);
    }
  } catch (err) {
    handleFirestoreError(err, isSaved ? 'create' : 'delete', path);
  }
}

// Student Inquiries & Consultation Requests
export async function submitStudentInquiry(inquiryData) {
  const localInquiriesKey = 'local_student_inquiries';
  let localList = [];
  try {
    const cached = localStorage.getItem(localInquiriesKey);
    if (cached) localList = JSON.parse(cached);
  } catch { localList = []; }

  const newInquiry = {
    id: 'inq_' + Date.now(),
    name: inquiryData.name || 'Anonymous Student',
    email: inquiryData.email || '',
    phone: inquiryData.phone || '',
    serviceType: inquiryData.serviceType || 'Contract Review',
    message: inquiryData.message || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  localList.unshift(newInquiry);
  localStorage.setItem(localInquiriesKey, JSON.stringify(localList));

  if (isFirebaseReady()) {
    try {
      const docRef = await addDoc(collection(db, 'inquiries'), newInquiry);
      newInquiry.id = docRef.id;
    } catch (err) {
      console.warn('Firestore inquiry write warning, saved locally:', err);
    }
  }
  return newInquiry;
}

export async function getStudentInquiries() {
  const localInquiriesKey = 'local_student_inquiries';
  let localList = [];
  try {
    const cached = localStorage.getItem(localInquiriesKey);
    if (cached) localList = JSON.parse(cached);
  } catch { localList = []; }

  if (!isFirebaseReady()) return localList;

  try {
    const snapshot = await getDocs(collection(db, 'inquiries'));
    if (!snapshot.empty) {
      const cloudList = [];
      snapshot.forEach(d => {
        cloudList.push({ id: d.id, ...d.data() });
      });
      return cloudList;
    }
  } catch (err) {
    console.warn('Firestore inquiries get warning, returning local:', err);
  }
  return localList;
}

export async function updateInquiryStatusInDb(inquiryId, newStatus) {
  const localInquiriesKey = 'local_student_inquiries';
  try {
    const cached = localStorage.getItem(localInquiriesKey);
    if (cached) {
      const list = JSON.parse(cached);
      const item = list.find(i => String(i.id) === String(inquiryId));
      if (item) item.status = newStatus;
      localStorage.setItem(localInquiriesKey, JSON.stringify(list));
    }
  } catch {}

  if (isFirebaseReady()) {
    try {
      await updateDoc(doc(db, 'inquiries', String(inquiryId)), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore inquiry status update warning:', err);
    }
  }
}

export async function deleteInquiryFromDb(inquiryId) {
  const localInquiriesKey = 'local_student_inquiries';
  try {
    const cached = localStorage.getItem(localInquiriesKey);
    if (cached) {
      const list = JSON.parse(cached).filter(i => String(i.id) !== String(inquiryId));
      localStorage.setItem(localInquiriesKey, JSON.stringify(list));
    }
  } catch {}

  if (isFirebaseReady()) {
    try {
      await deleteDoc(doc(db, 'inquiries', String(inquiryId)));
    } catch (err) {
      console.warn('Firestore inquiry delete warning:', err);
    }
  }
}

