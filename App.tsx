
import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { TripForm } from './components/TripForm';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginModal } from './components/LoginModal';
import { TripList } from './components/TripList';
import { generateItinerary, findCompanies, calculateBudget, generateTripImage } from './services/geminiService';
import { AppView, FormData, ItineraryResult, CompanyInfo, BudgetBreakdown, PhotoItem, SavedTrip } from './types';
import { onAuthChange, logOut, getTrips, saveTrip, getTripById } from './firebaseConfig';
import { User } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryResult | null>(null);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  
  // Auth & Persistence State
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Auth Listener & Check for Shared Link
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserTrips(currentUser.uid);
      } else {
        setSavedTrips([]);
      }
    });

    // Check for shared trip ID in URL
    const params = new URLSearchParams(window.location.search);
    const sharedTripId = params.get('tripId');
    
    if (sharedTripId) {
      handleLoadSharedTrip(sharedTripId);
    }

    return () => unsubscribe();
  }, []);

  // Fetch Trips
  const fetchUserTrips = async (userId: string) => {
    try {
      const trips = await getTrips(userId);
      setSavedTrips(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  const handleLoadSharedTrip = async (id: string) => {
    setView('loading');
    try {
      const trip = await getTripById(id);
      if (trip) {
        handleSelectSavedTrip(trip);
        // Clean URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // Trip not found or invalid
        alert("Trip not found or link is invalid.");
        setView('landing');
      }
    } catch (e) {
      console.error("Failed to load shared trip", e);
      setView('landing');
    }
  };

  // Save Trip
  const handleAutoSaveTrip = async (
    data: FormData, 
    res: ItineraryResult, 
    comp: CompanyInfo[], 
    bud: BudgetBreakdown | null, 
    pics: PhotoItem[]
  ) => {
    if (!user) return; // Only save if logged in
    
    setIsSaving(true);
    try {
      const tripData: SavedTrip = {
        userId: user.uid,
        destination: data.destination,
        createdAt: null, // Set by service
        formData: data,
        itinerary: res,
        companies: comp,
        budget: bud,
        photos: pics
      };
      
      const newTripId = await saveTrip(tripData);
      setCurrentTripId(newTripId);
      
      // Update local list
      fetchUserTrips(user.uid);
    } catch (e) {
      console.error("Error adding document: ", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    setView('loading');
    setFormData(data);
    setCurrentTripId(null); // Reset current ID for new generation
    
    try {
      const result = await generateItinerary(data);
      setItinerary(result);
      
      const compRes = await findCompanies(data);
      setCompanies(compRes);
      
      const budRes = await calculateBudget(data);
      setBudget(budRes);

      const imgPrompts = [
        `Cinematic shot of ${data.destination} city skyline, futuristic, sci-fi aesthetic, neon lights`,
        `Modern futuristic ${data.industry} facility interior in ${data.destination}, high tech, clean, sci-fi style`
      ];

      const images = await Promise.all(imgPrompts.map(p => generateTripImage(p)));
      const newPhotos: PhotoItem[] = images
        .filter((i): i is string => i !== null)
        .map((url, idx) => ({
          id: `gen-${Date.now()}-${idx}`,
          url,
          date: new Date().toISOString(),
          location: data.destination,
          tags: idx === 0 ? ['City View', 'AI Generated'] : ['Industry', 'AI Generated']
        }));

      setPhotos(newPhotos);
      
      // Auto-save if logged in
      if (user) {
        handleAutoSaveTrip(data, result, compRes, budRes, newPhotos);
      }
      
      setView('results');

    } catch (error) {
      console.error("Error generating trip:", error);
      alert("Something went wrong generating your trip. Please check your API key or try again.");
      setView('form');
    }
  };

  const handleAddPhoto = (photoItem: PhotoItem) => {
    setPhotos(prev => [photoItem, ...prev]);
    // Note: To fully persist photo additions to an existing saved trip, 
    // we would need an 'updateTrip' function in the service.
    // For now, this updates the current session view.
  };

  const handleUpdatePhoto = (updatedPhoto: PhotoItem) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const resetApp = () => {
    setItinerary(null);
    setCompanies([]);
    setBudget(null);
    setPhotos([]);
    setFormData(null);
    setCurrentTripId(null);
    setView('form');
  };

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setView('landing');
  };

  const handleSelectSavedTrip = (trip: SavedTrip) => {
    setFormData(trip.formData);
    setItinerary(trip.itinerary);
    setCompanies(trip.companies);
    setBudget(trip.budget);
    setPhotos(trip.photos || []);
    setCurrentTripId(trip.id || null);
    setView('results');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header/Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('landing')}>
                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">AI</div>
                <span className="font-bold text-xl tracking-tight text-white">IV-PLANNER</span>
            </div>
            
            <div className="flex items-center gap-4">
               {user ? (
                 <>
                   <button 
                     onClick={() => setView('myTrips')}
                     className={`text-sm font-medium transition-colors ${view === 'myTrips' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                   >
                     My Trips
                   </button>
                   <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-slate-600" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                      )}
                      <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400 transition-colors">Sign Out</button>
                   </div>
                 </>
               ) : (
                 <button 
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-sm font-bold transition-all border border-indigo-500/30"
                 >
                    Sign In
                 </button>
               )}
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {view === 'landing' && (
            <div className="relative">
               <Hero onStart={() => setView('form')} />
               {user && (
                  <div className="absolute bottom-10 left-0 right-0 text-center z-10">
                     <button 
                       onClick={() => setView('myTrips')}
                       className="text-slate-400 hover:text-indigo-400 underline decoration-indigo-500/50 underline-offset-4 transition-colors"
                     >
                        View your saved plans &rarr;
                     </button>
                  </div>
               )}
            </div>
        )}

        {view === 'loading' && (
            <LoadingScreen />
        )}

        {view === 'form' && (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <TripForm 
                  onSubmit={handleFormSubmit} 
                  isLoading={false} 
                  onBack={() => setView('landing')}
                  initialData={formData || undefined}
                />
            </div>
        )}

        {view === 'myTrips' && user && (
           <TripList 
             trips={savedTrips} 
             onSelectTrip={handleSelectSavedTrip}
             onBack={() => setView('landing')}
           />
        )}

        {view === 'results' && itinerary && formData && (
            <ItineraryDisplay 
                result={itinerary} 
                companies={companies}
                budget={budget}
                photos={photos}
                travelerCount={formData.travelerCount}
                tripId={currentTripId}
                onReset={resetApp}
                onBack={() => setView(user ? 'myTrips' : 'form')}
                onAddPhoto={handleAddPhoto}
                onUpdatePhoto={handleUpdatePhoto}
                onRemovePhoto={handleRemovePhoto}
            />
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
