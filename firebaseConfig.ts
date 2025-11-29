
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import { SavedTrip } from "./types";

// --- CONFIGURATION ---
// Replaced placeholder with the provided key
const firebaseConfig = {
  apiKey: "AIzaSyDrCKkIpYfM7Ej-gejo5Mg_aRtSTJgfkX4", 
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Check if we are using the placeholder
const isMockMode = firebaseConfig.apiKey.includes("YOUR-API-KEY");

let auth: any;
let db: any;
let googleProvider: any;

if (!isMockMode) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase init failed, falling back to mock", e);
  }
} else {
  console.warn("⚠️ Firebase Config missing. Running in MOCK MODE (LocalStorage).");
}

// --- AUTHENTICATION SERVICES ---

export const signInWithGoogle = async (): Promise<User> => {
  if (!isMockMode && auth) {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } else {
    // Mock Login
    console.log("Mocking Google Sign In...");
    await new Promise(resolve => setTimeout(resolve, 800)); // Fake network delay
    const mockUser: any = {
      uid: "mock-user-123",
      displayName: "Demo Traveller",
      email: "demo@ivplanner.app",
      photoURL: "", // Empty or a placeholder URL
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "",
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => "",
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null
    };
    
    // Trigger the mock auth listener
    mockAuthListeners.forEach(cb => cb(mockUser));
    return mockUser;
  }
};

export const logOut = async () => {
  if (!isMockMode && auth) {
    await signOut(auth);
  } else {
    // Mock Logout
    mockAuthListeners.forEach(cb => cb(null));
  }
};

// Mock Auth Listener Storage
const mockAuthListeners: ((user: User | null) => void)[] = [];

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!isMockMode && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    // Register callback for mock updates
    mockAuthListeners.push(callback);
    // Initial check (simulate checking session)
    // For demo, start logged out
    callback(null); 
    return () => {
      const idx = mockAuthListeners.indexOf(callback);
      if (idx > -1) mockAuthListeners.splice(idx, 1);
    };
  }
};

// --- DATABASE SERVICES ---

export const saveTrip = async (tripData: SavedTrip): Promise<string> => {
  if (!isMockMode && db) {
    const docRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    // Mock Save to LocalStorage
    console.log("Mocking Firestore Save...");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const trips = JSON.parse(localStorage.getItem('iv_planner_trips') || '[]');
    const newId = `trip-${Date.now()}`;
    const newTrip = {
      ...tripData,
      id: newId,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } // Mock Firestore Timestamp
    };
    trips.unshift(newTrip); // Add to top
    localStorage.setItem('iv_planner_trips', JSON.stringify(trips));
    return newId;
  }
};

export const getTrips = async (userId: string): Promise<SavedTrip[]> => {
  if (!isMockMode && db) {
    const q = query(
      collection(db, 'trips'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const trips: SavedTrip[] = [];
    querySnapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() } as SavedTrip);
    });
    return trips;
  } else {
    // Mock Fetch from LocalStorage
    console.log("Mocking Firestore Fetch...");
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const allTrips = JSON.parse(localStorage.getItem('iv_planner_trips') || '[]');
    // Filter by 'userId' to mimic security rules
    return allTrips.filter((t: any) => t.userId === userId);
  }
};

export const getTripById = async (tripId: string): Promise<SavedTrip | null> => {
  if (!isMockMode && db) {
    try {
      const docRef = doc(db, 'trips', tripId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SavedTrip;
      }
      return null;
    } catch (error) {
      console.error("Error getting trip by ID:", error);
      return null;
    }
  } else {
    // Mock Fetch ID
    await new Promise(resolve => setTimeout(resolve, 300));
    const allTrips = JSON.parse(localStorage.getItem('iv_planner_trips') || '[]');
    const trip = allTrips.find((t: any) => t.id === tripId);
    return trip || null;
  }
};
