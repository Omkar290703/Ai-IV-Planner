import React from 'react';
import { SavedTrip } from '../types';

interface TripListProps {
  trips: SavedTrip[];
  onSelectTrip: (trip: SavedTrip) => void;
  onBack: () => void;
}

export const TripList: React.FC<TripListProps> = ({ trips, onSelectTrip, onBack }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
        </button>
        <h2 className="text-3xl font-bold text-white">My Trips</h2>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-700 border-dashed rounded-xl">
          <div className="text-6xl mb-4">🧳</div>
          <h3 className="text-xl font-bold text-white mb-2">No trips found</h3>
          <p className="text-slate-400">You haven't planned any trips yet. Start a new adventure!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id} 
              onClick={() => onSelectTrip(trip)}
              className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              {/* Cover Image Placeholder or Map Snapshot */}
              <div className="h-40 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                {/* Try to show first photo if available, else abstract pattern */}
                {trip.photos && trip.photos.length > 0 ? (
                  <img src={trip.photos[0].url} alt="Trip cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900">
                     <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">✈️</div>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-4 z-20">
                   <h3 className="text-xl font-bold text-white">{trip.destination}</h3>
                   <div className="text-xs text-indigo-300 font-mono">
                      {new Date(trip.createdAt?.seconds * 1000).toLocaleDateString()}
                   </div>
                </div>
              </div>

              <div className="p-4">
                 <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                    <span className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                       {trip.formData.days} Days
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-xs">
                       {trip.formData.travelers} ({trip.formData.travelerCount})
                    </span>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Industry Focus</div>
                    <div className="text-sm text-white font-medium bg-slate-700/50 p-2 rounded">
                        {trip.formData.industry}
                    </div>
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                        {trip.itinerary?.days?.length || 0} Activities Planned
                    </span>
                    <button className="text-indigo-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                        View Plan &rarr;
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
